// SPDX-License-Identifier: Apache-2.0
// Acquisition authorities reviewed 2026-09-12:
// https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/Packages
// https://docs.nvidia.com/deploy/cuda-compatibility/forward-compatibility.html
// https://docs.python.org/release/3.14.7/using/unix.html#building-python
// dpkg-deb --extract unpacks data only; no package installation scripts are run.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, mkdtemp, open, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { hashCanonicalBuildContract } from './lib/canonical-examples.mjs';
import { scanArtifactBuffer } from './lib/quality-policy.mjs';

const image = 'nvidia/cuda:13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87';
const pythonUrl = 'https://www.python.org/ftp/python/3.14.7/Python-3.14.7.tar.xz';
const pythonSha256 = '3b48dac8fb59f62eaa67ac83c1eb12bda1b7a08406dd286e252c11a66be27f81';
const wheels = {
  'cuda-core': ['1.2.0', 'e138be12af795c69c1cb61e38562ea70e5a38616b2753e2a265231f1941394ef'],
  'cuda-bindings': ['13.4.1', '62df23df11074e9833bf348bbcf0b8eec2fcbded4f305c6fbaa3ed067433e97d'],
  'cuda-pathfinder': ['1.8.1', 'ae0137ff9e56ea97499bcbf54f5f2778ec25f3266715ac86da192a795af982a8'],
  numpy: ['2.5.3', 'b0521d0f4aebb6e06189451025fa17a913287b13c03d5fe05c017333b654ea5b'],
};
const root = path.resolve(import.meta.dirname, '..');
const nativeProfileBytes = await readFile(path.join(root, 'examples/ex21-cuda-python-launch/native-profile.json'));
const nativeProfile = JSON.parse(nativeProfileBytes);
const driverUrl = nativeProfile.archives['cuda-compat-13-3'].url;
const driverSha256 = nativeProfile.archives['cuda-compat-13-3'].sha256;
const packageFormat = '${Package}\\t${Status}\\t${Version}\\t${Architecture}\\n';
const artifactPath = 'artifacts/cuda-ex21/ex21-cpython-3-14-7-cuda-13-3-1-sm75';
// Nothing is recursively copied from the project, interpreter, downloads or build tree.
const allowedReports = [
  'pull.log', 'image.json', 'provision.log', 'setup.log', 'packages.txt', 'native-tools.txt',
  'file-hashes.txt', 'installation.json', 'host-test.json', 'host-test.log',
  'environment.json', 'environment.log', 'build.json', 'build.log', 'nvrtc.log',
  'link-info.log', 'link-error.log', 'sass.txt', 'invalid.json', 'invalid.log',
  'stale.json', 'stale.log', 'checks.json',
  'native-packages.json', 'native-packages.log', 'compiler-missing.json', 'compiler-missing.log',
  'compiler-unpacked.json', 'compiler-unpacked.log', 'native-packages-restored.json',
  'native-packages-restored.log', 'package-mutation.log', 'unowned-library.json', 'unowned-library.log',
];

const containerScript = String.raw`
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
if compgen -G '/dev/nvidia*' >/dev/null; then
  printf '%s\n' 'Refusing exposed NVIDIA device nodes on this GPU-free check.' >&2
  exit 1
fi
apt-get update
apt-get install -y --no-install-recommends build-essential ca-certificates curl xz-utils \
  libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev libffi-dev \
  liblzma-dev libzstd-dev libncurses-dev libgdbm-dev uuid-dev pkg-config
LC_ALL=C /usr/bin/dpkg-query --admindir=/var/lib/dpkg --showformat='${packageFormat}' --show > /reports/packages.txt
mkdir -p /work /opt/ex21-driver
cd /work
download() {
  curl --fail --location --proto '=https' --proto-redir '=https' --tlsv1.2 \
    --retry 3 --connect-timeout 30 --max-time 600 --output "$3" "$1"
  printf '%s  %s\n' "$2" "$3" | sha256sum --check --strict
}
download '${pythonUrl}' '${pythonSha256}' python.tar.xz
download '${driverUrl}' '${driverSha256}' compat.deb
download '${nativeProfile.archives['cuda-compiler-13-3'].url}' '${nativeProfile.archives['cuda-compiler-13-3'].sha256}' compiler.deb
test "$(dpkg-deb --field compat.deb Package)" = cuda-compat-13-3
test "$(dpkg-deb --field compat.deb Version)" = 610.43.02-1ubuntu1
test "$(dpkg-deb --field compat.deb Architecture)" = amd64
dpkg-deb --extract compat.deb /opt/ex21-driver
test -f /opt/ex21-driver/usr/local/cuda-13.3/compat/libcuda.so.610.43.02
cmp /opt/ex21-driver/usr/local/cuda-13.3/compat/libcuda.so.610.43.02 \
  /usr/local/cuda-13.3/compat/libcuda.so.610.43.02
tar --extract --xz --file python.tar.xz
cd /work/Python-3.14.7
./configure --prefix=/opt/ex21-python --with-ensurepip=install
make -j2
make altinstall
export PATH=/opt/ex21-python/bin:$PATH
export CUDA_PATH=/usr/local/cuda-13.3
export CUDA_HOME=/usr/local/cuda-13.3
export CUDA_CACHE_DISABLE=1
export LD_LIBRARY_PATH=/usr/local/cuda-13.3/compat:/usr/local/cuda-13.3/lib64
mkdir -p /work/project/scripts
cp /source/ex21.py /source/kernel.cu /source/project.json /source/requirements.lock \
  /source/environment-manifest.json /source/native-profile.json /work/project/
cp /source/scripts/setup.sh /work/project/scripts/
cd /work/project
bash scripts/setup.sh > /reports/setup.log 2>&1
{
  python3.14 --version
  gcc --version
  getconf GNU_LIBC_VERSION
  /usr/local/cuda-13.3/bin/cuobjdump --version
} > /reports/native-tools.txt 2>&1
sha256sum /opt/ex21-python/bin/python3.14 \
  /usr/local/cuda-13.3/compat/libcuda.so.610.43.02 \
  /work/project/native-profile.json /reports/packages.txt > /reports/file-hashes.txt
.venv/bin/python -I - <<'PY'
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

project = Path('/work/project')
reports = Path('/reports')
expected_wheels = json.loads('${JSON.stringify(wheels)}')
installation = json.loads((project / 'build/setup-install.json').read_text())
installed = {}
for item in installation['install']:
    name = re.sub(r'[-_.]+', '-', item['metadata']['name']).lower()
    installed[name] = [item['metadata']['version'],
        item['download_info']['archive_info']['hashes']['sha256']]
if installed != expected_wheels or len(installation['install']) != 4:
    raise RuntimeError('Installed artifacts do not match the four hash-pinned wheels')
(reports / 'installation.json').write_text(json.dumps({
    'pipVersion': installation['pip_version'], 'wheels': installed,
    'environment': installation['environment'],
}, indent=2))

def cli(name, entry, arguments, expected_status=0):
    with (reports / (name + '.json')).open('w') as out, (reports / (name + '.log')).open('w') as err:
        result = subprocess.run([sys.executable, '-I', str(entry), *arguments],
                                stdout=out, stderr=err, timeout=180)
    if result.returncode != expected_status:
        raise RuntimeError(name + ': unexpected CLI exit status ' + str(result.returncode))
    report = json.loads((reports / (name + '.json')).read_text())
    if report['result'] != ('pass' if expected_status == 0 else 'fail'):
        raise RuntimeError(name + ': inconsistent CLI result')
    if report['gpuExecuted'] is not False or (name != 'host-test' and report['driverInitialized'] is not False):
        raise RuntimeError(name + ': GPU execution or driver initialization is not permitted')
    return report

try:
    cli('host-test', project / 'ex21.py', ['host-test'])
    native = cli('native-packages', project / 'ex21.py', ['check-environment', '--phase', 'native-packages'])
    # These are real dpkg operations inside this disposable container, before loading CUDA.
    with (reports / 'package-mutation.log').open('w') as mutation_log:
        try:
            subprocess.run(['/usr/bin/dpkg', '--force-depends', '--remove', 'cuda-compiler-13-3'],
                           check=True, stdout=mutation_log, stderr=subprocess.STDOUT)
            missing = cli('compiler-missing', project / 'ex21.py', ['check-environment', '--phase', 'native-packages'], 1)
            if missing['stage'] != 'native-packages' or 'cuda-compiler-13-3' not in missing['error']['message']:
                raise RuntimeError('Missing compiler metapackage was not rejected')
            subprocess.run(['/usr/bin/dpkg', '--unpack', '/work/compiler.deb'],
                           check=True, stdout=mutation_log, stderr=subprocess.STDOUT)
            unpacked = cli('compiler-unpacked', project / 'ex21.py', ['check-environment', '--phase', 'native-packages'], 1)
            if unpacked['stage'] != 'native-packages' or 'install ok unpacked' not in unpacked['error']['message']:
                raise RuntimeError('An unpacked but unconfigured compiler package was accepted')
        finally:
            subprocess.run(['/usr/bin/dpkg', '--install', '/work/compiler.deb'],
                           check=True, stdout=mutation_log, stderr=subprocess.STDOUT)
    original = Path(native['environment']['nativeFiles']['nvrtc']['path'])
    backup = original.with_name(original.name + '.ex21-backup')
    unowned = original.parent / 'ex21-unowned' / original.name
    unowned.parent.mkdir()
    shutil.copyfile(original, unowned)
    original.rename(backup)
    try:
        original.symlink_to(unowned)
        unowned_result = cli('unowned-library', project / 'ex21.py', ['check-environment', '--phase', 'native-packages'], 1)
        if unowned_result['stage'] != 'native-package-files' or 'package ownership mismatch' not in unowned_result['error']['message']:
            raise RuntimeError('An unowned copy of the real NVRTC library was accepted')
    finally:
        original.unlink(missing_ok=True)
        backup.rename(original)
        unowned.unlink()
        unowned.parent.rmdir()
    restored = cli('native-packages-restored', project / 'ex21.py', ['check-environment', '--phase', 'native-packages'])
    if restored['environment']['nativeFiles'] != native['environment']['nativeFiles'] or \
            restored['environment']['toolkit']['packages'] != native['environment']['toolkit']['packages']:
        raise RuntimeError('Native package/file inspection was not restored')
    env = cli('environment', project / 'ex21.py', ['check-environment'])
    driver = env['environment']['nativeLibraries']['cuda']
    if driver['binaryCoordinate'] != '610.43.02' or driver['path'] != \
            '/usr/local/cuda-13.3/compat/libcuda.so.610.43.02':
        raise RuntimeError('The selected real driver library was not loaded')
    build = cli('build', project / 'ex21.py', ['build', '--arch', '75'])
    if build['backend'] != 'nvJitLink' or build['arch'] != '75' or build['cachePolicy'] != 'disabled':
        raise RuntimeError('Unexpected compiler target or linker backend')
    builtins = build['environment']['nativeLibraries']['nvrtcBuiltins']
    if builtins['observedVia'] != '/proc/self/maps after NVRTC compilation' or \
            builtins['package'] != 'cuda-nvrtc-13-3' or builtins['packageVersion'] != '13.3.33-1' or \
            builtins['sha256'] != native['environment']['nativeFiles']['nvrtcBuiltins']['sha256']:
        raise RuntimeError('Loaded NVRTC-builtins was not observed and package-checked')
    build_dir = project / 'build/compile'
    for artifact in build['artifacts']:
        data = (build_dir / artifact['path']).read_bytes()
        if len(data) != artifact['bytes'] or hashlib.sha256(data).hexdigest() != artifact['sha256']:
            raise RuntimeError('Build artifact hash/size mismatch')
    if not (build_dir / 'ex21.cubin').read_bytes().startswith(b'\x7fELF') or \
            not re.search(r'\.entry\s+ex21_vector_add\b', (build_dir / 'ex21.ptx').read_text()):
        raise RuntimeError('Missing real cubin/PTX artifacts')
    if 'ex21_vector_add' not in (build_dir / 'sass.txt').read_text():
        raise RuntimeError('Missing cuobjdump kernel inspection')
    before = {name: hashlib.sha256((build_dir / name).read_bytes()).hexdigest()
              for name in ('report.json', 'ex21.ptx', 'ex21.cubin')}
    stale = cli('stale', project / 'ex21.py', ['build', '--arch', '75'], 1)
    if stale['stage'] != 'artifact-directory' or 'fresh output directory' not in stale['error']['message']:
        raise RuntimeError('Stale-output refusal did not occur at the required boundary')
    if any(hashlib.sha256((build_dir / name).read_bytes()).hexdigest() != digest
           for name, digest in before.items()):
        raise RuntimeError('Stale-output attempt modified prior results')
    invalid = Path('/work/invalid')
    invalid.mkdir()
    shutil.copyfile(project / 'ex21.py', invalid / 'ex21.py')
    shutil.copyfile(project / 'native-profile.json', invalid / 'native-profile.json')
    (invalid / 'kernel.cu').write_text('#error EX21_EXPECTED_NVRTC_FAILURE\n')
    failure = cli('invalid', invalid / 'ex21.py', ['build', '--arch', '75'], 1)
    if failure['stage'] != 'compile-ptx' or failure['error']['type'] != 'NVRTCError' or \
            'EX21_EXPECTED_NVRTC_FAILURE' not in failure['error']['message']:
        raise RuntimeError('Expected a real NVRTC compilation diagnostic, not an earlier blocker')
    (reports / 'checks.json').write_text(json.dumps({
        'result': 'pass', 'hostTest': 'pass', 'canonicalImports': 'pass',
        'ptxCubinInspection': 'pass', 'invalidNvrtcRejected': True,
        'missingCompilerRejected': True, 'unpackedCompilerRejected': True,
        'unownedLibraryRejected': True, 'nativePackageStateRestored': True,
        'nvrtcBuiltinsObserved': True,
        'compilerAndLinkerCacheDisabled': True,
        'staleOutputRejectedAndUnchanged': True, 'gpuExecuted': False,
        'driverInitialized': False, 'runtimeEvidence': 'Pending Hardware Verification',
    }, indent=2))
finally:
    for name in ('nvrtc.log', 'link-info.log', 'link-error.log', 'sass.txt'):
        source = project / 'build/compile' / name
        if source.is_file():
            shutil.copyfile(source, reports / name)
PY
`;

async function main() {
  if (process.argv.length === 3 && process.argv[2] === '--help') {
    console.log('Usage: node scripts/run-ex21-python-check.mjs [--print-container-script]\nGPU-free EX21 check on Linux x86_64 with Docker; retains scanned text reports only.\n--print-container-script prints the pinned provisioning/check commands without executing them.');
    return;
  }
  if (process.argv.length === 3 && process.argv[2] === '--print-container-script') {
    process.stdout.write(containerScript);
    return;
  }
  if (process.argv.length !== 2) { process.exitCode = 2; return; }
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    throw new Error('This check requires Linux x86_64; no emulation profile is declared');
  }
  const output = path.join(root, artifactPath);
  try { await lstat(output); throw new Error('Use a fresh report directory'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const scratch = await mkdtemp(path.join(tmpdir(), 'ex21-python-'));
  const containerName = `ex21-python-${randomUUID()}`;
  let retentionSafe = true;
  const record = {
    'SPDX-License-Identifier': 'Apache-2.0', schemaVersion: 1, subject: 'EX21',
    kind: 'python-build-gate', result: 'fail', image,
    pythonSource: { url: pythonUrl, sha256: pythonSha256 },
    userspaceDriver: { url: driverUrl, sha256: driverSha256, version: '610.43.02-1ubuntu1' },
    compilerMetapackage: nativeProfile.archives['cuda-compiler-13-3'],
    nativeProfile: nativeProfile.id,
    nativeProfileSha256: createHash('sha256').update(nativeProfileBytes).digest('hex'),
    expectedWheels: wheels, stages: {}, gpuExecuted: false,
    checkedAt: new Date().toISOString(),
    runtimeEvidence: 'Pending Hardware Verification',
  };
  async function docker(args, log, input, timeout = 600_000) {
    const file = await open(path.join(scratch, log), 'wx');
    try {
      const result = spawnSync('docker', args, { input, stdio: ['pipe', file.fd, file.fd], timeout });
      record.stages[log] = { exitStatus: result.status, signal: result.signal, error: result.error?.code ?? null };
      if (result.error || result.status !== 0) throw new Error('Docker boundary failed; inspect scanned reports');
    } finally {
      await file.close();
      if (args[0] === 'run') {
        // A client timeout need not stop its container. Stop only this invocation before reading reports.
        const removal = spawnSync('docker', ['rm', '--force', containerName], { encoding: 'utf8', timeout: 30_000 });
        retentionSafe = !removal.error && (removal.status === 0 || removal.stderr.includes(`No such container: ${containerName}`));
        if (!retentionSafe) throw new Error('Could not establish container termination; refusing retention');
      }
    }
  }
  try {
    try {
      record.sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
      record.buildContractSha256 = await hashCanonicalBuildContract(root, 'EX21');
      record.runnerInputs = {};
      for (const input of ['scripts/run-ex21-python-check.mjs', 'scripts/lib/canonical-examples.mjs', 'scripts/lib/quality-policy.mjs']) {
        record.runnerInputs[input] = createHash('sha256').update(await readFile(path.join(root, input))).digest('hex');
      }
      await docker(['pull', '--platform', 'linux/amd64', image], 'pull.log');
      await docker(['image', 'inspect', '--format',
        '{"id":"{{.Id}}","architecture":"{{.Architecture}}","os":"{{.Os}}"}', image], 'image.json');
      const actual = JSON.parse(await readFile(path.join(scratch, 'image.json'), 'utf8'));
      if (actual.architecture !== 'amd64' || actual.os !== 'linux') throw new Error('Wrong container platform');
      await docker(['run', '--platform', 'linux/amd64', '--runtime=runc', '--rm', '--interactive',
        '--name', containerName,
        '--entrypoint', '/bin/bash', '--env', 'NVIDIA_VISIBLE_DEVICES=void', '--env', 'CUDA_VISIBLE_DEVICES=',
        '--mount', `type=bind,source=${path.join(root, 'examples/ex21-cuda-python-launch')},target=/source,readonly`,
        '--mount', `type=bind,source=${scratch},target=/reports`, image, '-se'],
      'provision.log', containerScript, 4_500_000);
      const checks = JSON.parse(await readFile(path.join(scratch, 'checks.json'), 'utf8'));
      if (checks.result !== 'pass') throw new Error('Missing complete CLI checks');
      record.result = 'pass';
    } catch {
      process.exitCode = 1;
      console.error('EX21 Python build gate failed; only sanitized diagnostics may be retained.');
    }
    if (!retentionSafe) throw new Error('Reports may still be changing; refusing retention');
    const reports = new Map([['gate.json', JSON.stringify(record, null, 2)]]);
    for (const name of allowedReports) {
      const file = path.join(scratch, name);
      let metadata;
      try { metadata = await lstat(file); }
      catch (error) { if (error.code === 'ENOENT') continue; throw new Error(`retention: ${name}: metadata read failed`); }
      if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > 50 * 1024 * 1024) {
        throw new Error(`retention: ${name}: unsafe report type or raw size exceeds 50 MiB`);
      }
      const bytes = await readFile(file).catch(() => { throw new Error(`retention: ${name}: read failed`); });
      let text;
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
      catch { throw new Error(`retention: ${name}: invalid UTF-8`); }
      // NVRTCError retains its C-string NUL inside tracebacks too; preserve it visibly in logs.
      if (name.endsWith('.log')) text = text.replaceAll('\0', '\\0');
      if (text.includes('\0')) throw new Error(`retention: ${name}: NUL in non-log report`);
      text = text.replaceAll(root, '/workspace').replaceAll(scratch, '/check-work');
      reports.set(name, text);
    }
    // Scan the complete candidate set before creating any uploadable files. Never print raw diagnostics.
    for (const [name, text] of reports) {
      if (Buffer.byteLength(text, 'utf8') > 50 * 1024 * 1024) throw new Error(`retention: ${name}: encoded size exceeds 50 MiB`);
      const violation = scanArtifactBuffer(Buffer.from(text), name)[0];
      if (violation) {
        throw new Error(`retention: ${name}: privacy rule ${violation.rule}`);
      }
    }
    await mkdir(path.dirname(output), { recursive: true }).catch(() => { throw new Error('retention: gate.json: output parent creation failed'); });
    await mkdir(output).catch(() => { throw new Error('retention: gate.json: output directory creation failed'); });
    for (const [name, text] of reports) await writeFile(path.join(output, name), text, { flag: 'wx' }).catch(() => { throw new Error(`retention: ${name}: write failed`); });
    console.log(`EX21 ${record.result}: scanned text reports retained in ${artifactPath}. No evidence labels changed.`);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const message = typeof error?.message === 'string' ? error.message : '';
  const named = /^retention: ([a-z-]+\.(?:json|log|txt)): /.exec(message);
  const safe = named && (named[1] === 'gate.json' || allowedReports.includes(named[1]))
    && message.length <= 512 && !/[\u0000-\u001f\u007f]/.test(message)
    && scanArtifactBuffer(Buffer.from(message), 'runner-error.log').length === 0;
  console.error(safe ? message : 'EX21 check could not finish safely; no unscanned diagnostics will be uploaded. Use --help for requirements.');
  process.exitCode = 1;
});
