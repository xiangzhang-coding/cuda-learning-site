# SPDX-License-Identifier: Apache-2.0
"""Positive/negative fresh-process imports in a disposable installed environment."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import sysconfig


def main():
    if not sys.flags.isolated or sys.prefix == sys.base_prefix:
        raise RuntimeError("Use python -I inside a disposable virtual environment")
    import torch
    import cuda_learning_ops
    from cuda_learning_ops import _C

    package = Path(cuda_learning_ops.__file__).resolve()
    extension = Path(_C.__file__).resolve()
    site = Path(sysconfig.get_path("platlib")).resolve()
    if not package.is_relative_to(site) or not extension.is_relative_to(site):
        raise RuntimeError("Import did not select this environment's installed wheel")
    if Path(_C.__file__).is_symlink():
        raise RuntimeError("The negative test requires a regular installed extension")
    command = [sys.executable, "-I", "-c",
               "import torch; import cuda_learning_ops; from cuda_learning_ops import adjacent_energy; "
               "import cuda_learning_ops; assert adjacent_energy(torch.tensor([1.,-2.,2.])).tolist()==[9.,16.]"]
    subprocess.run(command, check=True)
    digest = hashlib.sha256(extension.read_bytes()).hexdigest()
    hidden = extension.with_name(extension.name + ".ex22-hidden")
    if hidden.exists():
        raise RuntimeError("Refusing to replace a previous negative-test backup")
    extension.rename(hidden)
    try:
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode == 0 or "_C" not in result.stderr:
            raise AssertionError("Missing installed extension did not produce the expected import failure")
    finally:
        hidden.rename(extension)
    subprocess.run(command, check=True)
    print(json.dumps({"result": "pass", "scope": "ex22-installed-import",
                      "negativeImport": "failed-as-required", "extensionSha256": digest,
                      "gpuExecuted": False}))


if __name__ == "__main__":
    main()
