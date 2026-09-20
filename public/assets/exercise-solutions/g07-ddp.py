# SPDX-License-Identifier: Apache-2.0
"""Original G07 reference solution. GPU execution is Pending Hardware Verification.

Only main imports torch: reference_values can be checked on a GPU-free host.
Run through the lesson's bounded, single-node launcher after its environment gate.
"""
import argparse
from contextlib import nullcontext
from datetime import timedelta
import json
import os


def reference_values(world_size, mode):
    if not 2 <= world_size <= 8 or mode not in ("baseline", "accumulate"):
        raise ValueError("requires 2-8 ranks and baseline or accumulate")
    microbatches = 2 if mode == "accumulate" else 1
    factor = sum((rank + 1 + micro) ** 2
                 for rank in range(world_size)
                 for micro in range(microbatches)) / (world_size * microbatches)
    weight = 1.0
    result = []
    for _ in range(2):
        gradient = weight * factor
        weight -= gradient / 8
        result.append((gradient, weight))
    return result


def main():
    import torch
    import torch.distributed as dist
    from torch.distributed.elastic.multiprocessing.errors import record
    from torch.nn.parallel import DistributedDataParallel as DDP

    @record
    def worker():
        parser = argparse.ArgumentParser()
        parser.add_argument("--mode", choices=("baseline", "accumulate"), default="baseline")
        args = parser.parse_args()
        rank = int(os.environ["RANK"])
        local_rank = int(os.environ["LOCAL_RANK"])
        world = int(os.environ["WORLD_SIZE"])
        expected = reference_values(world, args.mode)
        if int(os.environ["LOCAL_WORLD_SIZE"]) != world or rank != local_rank:
            raise RuntimeError("G07 requires one node, one process per visible GPU")
        if torch.__version__ != "2.11.0+cu128" or torch.version.cuda != "12.8":
            raise RuntimeError("wrong torch build; complete the pinned environment check")
        if torch.version.git_version != "70d99e998b4955e0049d13a98d77ae1b14db1f45":
            raise RuntimeError("wrong torch source identity")
        if torch.cuda.device_count() != world:
            raise RuntimeError("visibility must contain exactly one distinct GPU per rank")
        torch.cuda.set_device(local_rank)
        device = torch.device("cuda", local_rank)
        props = torch.cuda.get_device_properties(device)
        if (props.major, props.minor) < (7, 5) or props.total_memory < 8_000_000_000:
            raise RuntimeError("requires CC 7.5+ and at least 8 GB per GPU")
        if torch.cuda.mem_get_info(device)[0] < 1_073_741_824:
            raise RuntimeError("requires at least 1 GiB free per GPU")
        if torch.cuda.nccl.version() != (2, 28, 9):
            raise RuntimeError("loaded NCCL does not match 2.28.9")
        if torch.cuda.memory.get_allocator_backend() != "native":
            raise RuntimeError("requires native allocator")

        def log(stage, **fields):
            print(json.dumps(dict(rank=rank, local_rank=local_rank, world_size=world,
                                  mode=args.mode, stage=stage, **fields)), flush=True)

        log("ownership", device=str(device), nccl=list(torch.cuda.nccl.version()))
        dist.init_process_group("nccl", init_method="env://", device_id=device,
                                timeout=timedelta(seconds=60))
        log("initialized")
        model = torch.nn.Linear(1, 1, bias=False, dtype=torch.float64, device=device)
        with torch.no_grad():
            model.weight.fill_(1.0)
        ddp = DDP(model, device_ids=[local_rank], output_device=local_rank,
                  broadcast_buffers=False, find_unused_parameters=False,
                  gradient_as_bucket_view=False)
        optimizer = torch.optim.SGD(ddp.parameters(), lr=1 / 8)
        microbatches = 2 if args.mode == "accumulate" else 1
        for step, (gradient, weight) in enumerate(expected):
            optimizer.zero_grad(set_to_none=True)
            for micro in range(microbatches):
                context = ddp.no_sync() if micro + 1 < microbatches else nullcontext()
                with context:  # Forward AND backward belong inside no_sync.
                    x = torch.full((1, 1), rank + 1 + micro, dtype=torch.float64, device=device)
                    loss = ddp(x).square().mean() / (2 * microbatches)
                    loss.backward()
            torch.cuda.synchronize(device)
            torch.testing.assert_close(model.weight.grad,
                                       torch.full_like(model.weight, gradient), rtol=1e-12, atol=1e-12)
            optimizer.step()
            torch.cuda.synchronize(device)
            torch.testing.assert_close(model.weight,
                                       torch.full_like(model.weight, weight), rtol=1e-12, atol=1e-12)
            log("checked-step", step=step, gradient=model.weight.grad.item(), weight=model.weight.item())

        # Independent scalar collective: never reduce the DDP gradients twice.
        origin = torch.cuda.current_stream(device)
        producer = torch.cuda.Stream(device=device)
        consumer = torch.cuda.Stream(device=device)
        producer.wait_stream(origin)
        with torch.cuda.stream(producer):
            payload = torch.full((1,), rank + 1, dtype=torch.float64, device=device)
        origin.wait_stream(producer)
        work = dist.all_reduce(payload, async_op=True)
        with torch.cuda.stream(consumer):
            work.wait()  # Installs the completion dependency on THIS current stream.
            payload.record_stream(consumer)  # Lifetime, not producer readiness.
            result = payload * 2
        consumer.synchronize()
        torch.testing.assert_close(result, torch.full_like(result, world * (world + 1)),
                                   rtol=0, atol=0)
        log("checked-stream", value=result.item())
        # All references stay alive through completion. Every healthy rank tears down.
        dist.destroy_process_group()
        log("destroyed")

    # On failure propagate to torchrun; do not enter a new barrier in finally.
    # Process-group watchdogs and the external supervisor bound failed teardown.
    worker()


if __name__ == "__main__":
    main()
