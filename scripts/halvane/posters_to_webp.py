"""Turn the transparent Cycles posters into web stills.

Usage: python scripts/halvane/posters_to_webp.py <model posters dir> <site public/3d/halvane/posters dir> [--sheet <png>]

The posters come from build_speaker.py --posters (square RGBA, {finish}-{state}.png). The baked contact shadow
can reach the square's edge, which shows as a seam over the page's background, so alpha is faded to zero
over the outer EDGE fraction of each side first. Each poster is written as WebP at every width in SIZES,
and the script prints the byte size and the largest alpha left on the border so the result is measured,
not assumed. --sheet writes every poster over the page's Night colour for a visual check.
"""
import json
import os
import sys

from PIL import Image, ImageChops

SIZES = (800, 1200, 1600)
EDGE = 0.07
NIGHT = (16, 14, 12, 255)
STATES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "lib", "halvane",
                                     "cameras.json"), encoding="utf-8"))["states"]


def ramp(n):
    m = max(1, int(n * EDGE))
    out = bytearray(n)
    for i in range(n):
        t = min(1.0, min(i, n - 1 - i) / m)
        out[i] = round(255 * t * t * (3 - 2 * t))
    return bytes(out)


def fade_edges(im):
    w, h = im.size
    row = Image.frombytes("L", (w, 1), ramp(w)).resize((w, h), Image.Resampling.NEAREST)
    col = Image.frombytes("L", (1, h), ramp(h)).resize((w, h), Image.Resampling.NEAREST)
    r, g, b, a = im.split()
    return Image.merge("RGBA", (r, g, b, ImageChops.multiply(a, ImageChops.multiply(row, col))))


def border_alpha(im, px=2):
    a = im.getchannel("A")
    w, h = a.size
    boxes = ((0, 0, w, px), (0, h - px, w, h), (0, 0, px, h), (w - px, 0, w, h))
    return max(a.crop(b).getextrema()[1] for b in boxes)


def main():
    args = sys.argv[1:]
    sheet_path = None
    if "--sheet" in args:
        i = args.index("--sheet")
        sheet_path = args[i + 1]
        del args[i:i + 2]
    if len(args) != 2:
        sys.exit(__doc__)
    src, dst = args
    os.makedirs(dst, exist_ok=True)
    done = []
    for fn in sorted(os.listdir(src)):
        stem, ext = os.path.splitext(fn)
        finish, _, state = stem.partition("-")
        if ext != ".png" or finish not in ("walnut", "chalk", "graphite") or state not in STATES:
            continue
        im = fade_edges(Image.open(os.path.join(src, fn)).convert("RGBA"))
        # a cover poster (cameras.json poster.cover) is wider than its state's fov: its widths scale with it
        cover = STATES[state].get("poster", {}).get("cover", 1)
        widths = [round(s * cover) for s in SIZES]
        sizes = []
        for s in widths:
            out = os.path.join(dst, f"{stem}-{s}.webp")
            im.resize((s, s), Image.Resampling.LANCZOS).save(out, "WEBP", quality=82, alpha_quality=85, method=6)
            sizes.append(os.path.getsize(out))
        print(f"{stem:32s} " + "  ".join(f"{s}:{b / 1024:6.1f} KB" for s, b in zip(widths, sizes))
              + f"  border alpha {border_alpha(im)}")
        done.append((stem, im))
    if sheet_path and done:
        cols = 4
        cell = 400
        sheet = Image.new("RGB", (cols * cell, -(-len(done) // cols) * cell), NIGHT[:3])
        for k, (_, im) in enumerate(done):
            bg = Image.new("RGBA", im.size, NIGHT)
            bg.alpha_composite(im)
            sheet.paste(bg.convert("RGB").resize((cell, cell), Image.Resampling.LANCZOS), ((k % cols) * cell, (k // cols) * cell))
        sheet.save(sheet_path)
        print("sheet", sheet_path, [s for s, _ in done])


if __name__ == "__main__":
    main()
