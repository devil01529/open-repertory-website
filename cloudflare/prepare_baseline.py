"""Recover the hash-pinned clinical baseline outside public source directories."""
from pathlib import Path
import hashlib, shutil, subprocess, zipfile

ROOT = Path(__file__).resolve().parents[1]
work = ROOT / 'cloudflare/.build'
work.mkdir(parents=True, exist_ok=True)
apk = work / 'baseline.apk'
digest = '9be52ef0524a509cf69a22cd7c09634b1946d166f25297988b1046d456710b59'
if not apk.exists():
    subprocess.run(['curl', '-fL', '--retry', '2', '-o', str(apk),
      'https://raw.githubusercontent.com/devil01529/similora-update/ffdf665870a5711f5628f1d2068280d30f0d3fc7/prepared/v1.41/Open-Repertory-1.41.apk'], check=True)
if hashlib.sha256(apk.read_bytes()).hexdigest() != digest:
    raise SystemExit('Clinical baseline checksum mismatch')
source = work / 'baseline'
if source.exists(): shutil.rmtree(source)
source.mkdir()
with zipfile.ZipFile(apk) as archive:
    for name in archive.namelist():
        if not name.startswith('assets/www/') or name.endswith('/'): continue
        relative = Path(name[len('assets/www/'):])
        target = (source / relative).resolve()
        if not target.is_relative_to(source.resolve()): raise SystemExit('Unsafe asset path')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(archive.read(name))
print('Verified and recovered clinical baseline')
