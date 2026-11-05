from pathlib import Path
import json
from io import BytesIO
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
changes = []
for path in (root / 'src/assets').rglob('*.jpg'):
    if '_nor_' in path.name:
        image = Image.open(path).convert('RGB')
        image.thumbnail((768, 768), Image.Resampling.LANCZOS)
        quality = 96
    else:
        image = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
        image.thumbnail((1408, 1408), Image.Resampling.LANCZOS)
        quality = 88
    output = path.with_suffix('.webp')
    encoded = BytesIO()
    image.save(encoded, 'WEBP', quality=quality, method=6)
    if len(encoded.getbuffer()) < path.stat().st_size:
        output.write_bytes(encoded.getvalue())
        changes.append((path, output))

for source in (root / 'src').rglob('*'):
    if source.suffix not in ('.js', '.jsx'):
        continue
    original_text = source.read_text(encoding='utf-8')
    text = original_text
    for original, replacement in changes:
        text = text.replace(original.name, replacement.name)
    if text != original_text:
        source.write_text(text, encoding='utf-8')

report = {'images': len(changes), 'beforeBytes': sum(a.stat().st_size for a, _ in changes), 'afterBytes': sum(b.stat().st_size for _, b in changes)}
report_dir = root / 'output'
report_dir.mkdir(parents=True, exist_ok=True)
(report_dir / 'texture-optimization.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report))
