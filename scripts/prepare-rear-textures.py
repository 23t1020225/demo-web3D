"""Rectify small material samples from the supplied room photographs."""
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageFilter


source = Path(sys.argv[1])
output = Path(__file__).resolve().parents[1] / 'src' / 'assets' / 'rear'
output.mkdir(parents=True, exist_ok=True)
photos = {i: Image.open(next(source.glob(f'{i}-*.jpg'))).convert('RGB') for i in (1, 2, 3, 4)}
photos[1] = photos[1].resize((1368, 1824), Image.Resampling.LANCZOS)


def rectify(name, photo, corners, size):
    width, height = size
    target = [(0, 0), (width, 0), (width, height), (0, height)]
    rows, values = [], []
    for (x, y), (u, v) in zip(target, corners):
        rows += [[x, y, 1, 0, 0, 0, -u*x, -u*y], [0, 0, 0, x, y, 1, -v*x, -v*y]]
        values += [u, v]
    coefficients = np.linalg.solve(np.array(rows), np.array(values))
    image = photos[photo].transform(size, Image.Transform.PERSPECTIVE, coefficients, Image.Resampling.BICUBIC)
    image.save(output / f'{name}.jpg', quality=94, subsampling=0)


rectify('door-leaf', 3, [(780, 309), (996, 307), (1005, 891), (777, 882)], (512, 1408))
rectify('door-transom', 3, [(783, 160), (995, 156), (998, 286), (781, 288)], (512, 320))
rectify('privacy-brick', 2, [(545, 249), (716, 240), (711, 446), (548, 450)], (512, 640))
rectify('privacy-diamond', 2, [(539, 178), (723, 163), (719, 235), (543, 243)], (512, 224))
rectify('cabinet-front', 2, [(279, 448), (414, 419), (434, 574), (302, 630)], (512, 640))
rectify('cabinet-side', 2, [(98, 457), (247, 444), (266, 616), (140, 651)], (512, 640))
rectify('cabinet-marble', 2, [(309, 662), (361, 639), (380, 763), (336, 810)], (256, 512))
rectify('oats', 2, [(179, 475), (229, 469), (247, 549), (201, 558)], (192, 320))
rectify('fridge-upper', 1, [(918, 833), (1211, 833), (1213, 1092), (920, 1090)], (512, 448))
rectify('fridge-lower', 1, [(922, 1105), (1214, 1100), (1218, 1574), (926, 1577)], (512, 896))

# Keep genuine porcelain grain, removing the broad lighting gradient so it can be lit in 3D.
for name, photo, bounds, size in [
    ('wall-porcelain', 4, (718, 416, 878, 491), (1024, 512)),
    ('floor-porcelain', 2, (744, 762, 938, 893), (768, 768)),
]:
    patch = photos[photo].crop(bounds).resize(size, Image.Resampling.LANCZOS)
    pixels = np.asarray(patch).astype(float)
    low_frequency = np.asarray(patch.filter(ImageFilter.GaussianBlur(45))).astype(float)
    grain = np.clip((pixels - low_frequency) * .5 + np.array([231, 231, 222]), 0, 255).astype('uint8')
    Image.fromarray(grain).save(output / f'{name}.jpg', quality=93)

# Defocused outdoor color, leaving all window bars as actual geometry.
photos[4].crop((594, 344, 620, 563)).resize((320, 640), Image.Resampling.BICUBIC).filter(
    ImageFilter.GaussianBlur(4)
).save(output / 'window-daylight.jpg', quality=90)

print(f'Prepared {len(list(output.glob("*.jpg")))} reference material textures.')
