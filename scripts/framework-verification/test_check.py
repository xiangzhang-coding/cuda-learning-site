# SPDX-License-Identifier: Apache-2.0
"""Constructed parser fixtures only: no collected GPU events or performance data."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("framework_check", Path(__file__).with_name("check.py"))
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)


def fixture(*backends, device=True):
    events = [{"name": check.BACKEND_EVENTS[b], "ph": "X", "cat": "cpu_op"} for b in backends]
    if device:
        events.append({"name": "constructed-kernel-not-an-observation", "ph": "X", "cat": "kernel"})
    return {"traceEvents": events}


class DispatchEvidenceTests(unittest.TestCase):
    def test_each_exact_backend_is_recognized_without_policy_inference(self):
        for backend in check.BACKEND_EVENTS:
            with self.subTest(backend=backend):
                summary = check.trace_summary(fixture(backend))
                check.require_dispatch(summary, "AUTO")
                check.require_dispatch(summary, backend)
                self.assertEqual(summary["observedBackendEvents"], [backend])

    def test_cpu_only_trace_cannot_claim_cuda_dispatch(self):
        summary = check.trace_summary(fixture("FLASH_ATTENTION", device=False))
        with self.assertRaisesRegex(ValueError, "No device"):
            check.require_dispatch(summary, "FLASH_ATTENTION")

    def test_generic_range_and_unrecognized_events_fail_closed(self):
        trace = fixture()
        trace["traceEvents"].append({"name": "aten::scaled_dot_product_attention", "ph": "X"})
        with self.assertRaisesRegex(ValueError, "unrecognized"):
            check.require_dispatch(check.trace_summary(trace), "AUTO")

    def test_ambiguous_backend_events_fail_closed(self):
        with self.assertRaisesRegex(ValueError, "ambiguous"):
            check.require_dispatch(check.trace_summary(fixture("MATH", "FLASH_ATTENTION")), "AUTO")

    def test_forced_policy_cannot_silently_fallback(self):
        with self.assertRaisesRegex(ValueError, "differs"):
            check.require_dispatch(check.trace_summary(fixture("MATH")), "FLASH_ATTENTION")

    def test_metadata_name_and_cpu_flash_are_not_cuda_events(self):
        trace = fixture()
        trace["traceEvents"].extend([
            {"name": check.BACKEND_EVENTS["FLASH_ATTENTION"], "ph": "M"},
            {"name": "aten::_scaled_dot_product_flash_attention_for_cpu", "ph": "X"},
        ])
        self.assertEqual(check.trace_summary(trace)["observedBackendEvents"], [])


if __name__ == "__main__":
    unittest.main()
