#!/usr/bin/env python3
"""Lumen One surface textures, generated procedurally (numpy + Pillow).

Every texture tiles. Columns run along the grain (u), rows across it (v).
Outputs, per finish (walnut, chalk, graphite):
  <master>/<finish>-color.png   sRGB albedo, 2048 px
  <master>/<finish>-height.png  height, 2048 px (pores low; the scene derives
                                normals and roughness from it)
  <web>/<finish>-color-{2k,1k}.webp, <web>/<finish>-height-{2k,1k}.webp
the woofer cone's paper-composite fibre (512 px): paper-color, paper-height,
and the wool wadding behind the service door (512 px): wadding-color, wadding-height.

Usage: python -I textures.py <master_dir> <web_dir> [--preview <png>] [--only <name,...>]
The scene maps 1 texture repeat to 0.55 m of cabinet, about 3.7 px per mm at 2048.
"""
import os
import sys

import numpy as np
from PIL import Image

SIZE = 2048


def cr_w(t):
    t2 = t * t
    t3 = t2 * t
    return (-0.5 * t3 + t2 - 0.5 * t, 1.5 * t3 - 2.5 * t2 + 1.0,
            -1.5 * t3 + 2.0 * t2 + 0.5 * t, 0.5 * t3 - 0.5 * t2)


def pnoise(h, w, cy, cx, rng):
    """Tileable value noise on a (cy, cx) lattice, Catmull-Rom interpolated."""
    g = rng.standard_normal((cy, cx)).astype(np.float32)
    x = (np.arange(w, dtype=np.float32) + 0.5) * cx / w
    i = np.floor(x).astype(np.int64)
    wx = cr_w(x - i)
    r = np.zeros((cy, w), np.float32)
    for k in range(4):
        r += g[:, (i + k - 1) % cx] * wx[k][None, :]
    y = (np.arange(h, dtype=np.float32) + 0.5) * cy / h
    j = np.floor(y).astype(np.int64)
    wy = cr_w(y - j)
    out = np.zeros((h, w), np.float32)
    for k in range(4):
        out += r[(j + k - 1) % cy, :] * wy[k][:, None]
    return out


def fbm(h, w, cy, cx, rng, octaves=4, gain=0.5):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        out += amp * pnoise(h, w, min(h, cy * 2 ** o), min(w, cx * 2 ** o), rng)
        tot += amp
        amp *= gain
    out /= tot
    return out / (out.std() + 1e-6)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def streaks(mask, length):
    """Turn sparse points into short dashes along the grain (tapered, wraps)."""
    out = np.zeros_like(mask)
    half = length / 2.0
    for k in range(-int(half), int(half) + 1):
        out += np.roll(mask, k, axis=1) * (1.0 - abs(k) / (half + 1.0))
    out = 0.25 * np.roll(out, 1, 0) + 0.5 * out + 0.25 * np.roll(out, -1, 0)
    return np.clip(out, 0.0, 1.0)


def pores(h, w, density, lengths, rng, weight=None):
    acc = np.zeros((h, w), np.float32)
    for length in lengths:
        m = (rng.random((h, w)) < density / len(lengths)).astype(np.float32)
        if weight is not None:
            m *= (rng.random((h, w)) < weight).astype(np.float32)
        m *= rng.uniform(0.55, 1.0, (h, w)).astype(np.float32)
        acc = np.maximum(acc, streaks(m, length))
    return acc


def srgb_to_lin(c):
    c = np.asarray(c, np.float32) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lin_to_srgb8(c):
    c = np.clip(c, 0.0, 1.0)
    s = np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)
    return (s * 255.0 + 0.5).astype(np.uint8)


def ramp(t, stops):
    """Colour ramp interpolated in linear light. stops: [(pos, '#rrggbb')]."""
    pos = np.array([p for p, _ in stops], np.float32)
    cols = np.array([srgb_to_lin([int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)])
                     for _, c in stops], np.float32)
    t = np.clip(t, 0.0, 1.0)
    out = np.empty(t.shape + (3,), np.float32)
    for ch in range(3):
        out[..., ch] = np.interp(t, pos, cols[:, ch])
    return out


def norm01(x, lo=1.0, hi=99.0):
    a, b = np.percentile(x, [lo, hi])
    return np.clip((x - a) / (b - a + 1e-6), 0.0, 1.0)


def ring_field(h, w, rings, warps, rng):
    v = ((np.arange(h, dtype=np.float32) + 0.5) / h)[:, None]
    d = v * rings
    for amp, cy, cx in warps:
        d = d + amp * pnoise(h, w, cy, cx, rng)
    return d - np.floor(d), d


def along_rings(d, rings, cells, rng, octaves=3):
    """Noise that follows the warped growth rings (colour bands bend with the grain)."""
    out = np.zeros_like(d)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        c = cells * 2 ** o
        g = rng.standard_normal(c).astype(np.float32)
        x = d / rings * c
        i = np.floor(x).astype(np.int64)
        w = cr_w(x - i)
        out += amp * sum(g[(i + k - 1) % c] * w[k] for k in range(4))
        tot += amp
        amp *= 0.5
    out /= tot
    return out / (out.std() + 1e-6)


def walnut(n, rng):
    ring, d = ring_field(n, n, 104, [(2.6, 3, 1), (0.9, 9, 2), (0.3, 40, 4)], rng)
    late = smooth(0.5, 0.9, ring) * (1.0 - smooth(0.9, 1.0, ring))
    band = along_rings(d, 104, 26, rng)
    drift = fbm(n, n, 6, 3, rng, octaves=3)
    fib = fbm(n, n, 512, 24, rng, octaves=2, gain=0.6)
    # semi-ring-porous: pores crowd the start of each ring and thin out across it
    pr = pores(n, n, 0.0062, (6, 10, 15), rng, weight=0.25 + 0.75 * (1.0 - ring))
    t = 0.55 + 0.12 * band + 0.05 * drift - 0.14 * late + 0.025 * fib - 0.24 * pr
    albedo = ramp(t, [(0.0, "#1d140e"), (0.28, "#33231a"), (0.5, "#4a3526"),
                      (0.72, "#614634"), (1.0, "#7c604a")])
    height = 0.72 - 0.06 * late + 0.02 * fib - 0.62 * pr
    return albedo, height


def ash_like(n, rng, rings, warps, pore_density):
    ring, d = ring_field(n, n, rings, warps, rng)
    early = 1.0 - smooth(0.0, 0.26, ring)          # ring-porous band after each boundary
    late = smooth(0.55, 0.95, ring) * (1.0 - smooth(0.95, 1.0, ring))
    fib = fbm(n, n, 512, 24, rng, octaves=2, gain=0.6)
    pr = pores(n, n, pore_density, (5, 9, 14), rng) * (0.2 + 0.8 * early)
    band = along_rings(d, rings, 22, rng)
    return band, early, late, fib, pr


def graphite(n, rng):
    band, early, late, fib, pr = ash_like(n, rng, 66, [(2.4, 2, 1), (0.9, 7, 2), (0.3, 36, 4)], 0.016)
    patchy = 0.6 + 0.4 * norm01(fbm(n, n, 40, 6, rng, octaves=3))
    t = 0.55 + 0.07 * band + 0.1 * late - 0.22 * early * patchy - 0.4 * pr + 0.02 * fib
    albedo = ramp(t, [(0.0, "#141312"), (0.35, "#22201e"), (0.6, "#2f2c2a"), (1.0, "#46423e")])
    height = 0.7 - 0.08 * early + 0.02 * fib - 0.55 * pr
    return albedo, height


def chalk(n, rng):
    band, early, late, fib, pr = ash_like(n, rng, 84, [(2.8, 2, 1), (0.9, 8, 2), (0.3, 40, 4)], 0.018)
    t = 0.62 + 0.045 * band + 0.03 * late - 0.08 * early - 0.3 * pr + 0.012 * fib
    albedo = ramp(t, [(0.0, "#b3a998"), (0.5, "#cfc6b7"), (1.0, "#e4dccf")])
    height = 0.72 - 0.05 * early + 0.015 * fib - 0.5 * pr
    return albedo, height


def paper(n, rng):
    """Pressed paper-composite fibre: short strokes in every direction."""
    from PIL import ImageDraw
    img = Image.new("L", (n, n), 128)
    dr = ImageDraw.Draw(img)
    for _ in range(9000):
        x, y = rng.uniform(0, n, 2)
        a = rng.uniform(0, np.pi)
        ln = rng.uniform(4, 22)
        dx, dy = np.cos(a) * ln / 2, np.sin(a) * ln / 2
        val = int(rng.choice([rng.integers(70, 115), rng.integers(140, 190)]))
        for ox in (-n, 0, n):
            for oy in (-n, 0, n):
                dr.line([(x - dx + ox, y - dy + oy), (x + dx + ox, y + dy + oy)], fill=val, width=1)
    f = np.asarray(img, np.float32) / 255.0
    f = 0.25 * np.roll(f, 1, 0) + 0.25 * np.roll(f, 1, 1) + 0.5 * f
    mott = fbm(n, n, 6, 6, rng, octaves=3)
    t = 0.5 + 0.5 * (f - 0.5) + 0.05 * mott
    albedo = ramp(t, [(0.0, "#211e1b"), (0.5, "#34302c"), (1.0, "#4a4540")])
    height = 0.5 + 0.8 * (f - 0.5)
    return albedo, height


def wadding(n, rng):
    """Undyed grey wool wadding behind the service door: soft tufts with dark gaps between them, crimped wisp
    bundles lying every way across them, and fine fibre on top. One repeat is 0.2 m (build_speaker.py's UVs), so
    a pixel is about 0.4 mm: the tufts (2-5 cm) and the wisp bundles (1-2 mm wide) are what the close-up resolves."""
    from PIL import ImageDraw, ImageFilter

    def strokes(count, lengths, width, vals, crimp, spread):
        img = Image.new("L", (n, n), 0)
        dr = ImageDraw.Draw(img)
        for _ in range(count):
            x, y = rng.uniform(0, n, 2)
            # carded wool: the fibre mostly lies one way (along u), with `spread` radians of scatter
            a = rng.normal(0.0, spread) + (np.pi if rng.random() < 0.5 else 0.0)
            step = rng.uniform(*lengths) / 6
            pts = [(x, y)]
            for _ in range(6):
                a += rng.normal(0, crimp)
                x, y = x + np.cos(a) * step, y + np.sin(a) * step
                pts.append((x, y))
            v = int(rng.integers(*vals))
            for ox in (-n, 0, n):
                for oy in (-n, 0, n):
                    dr.line([(px + ox, py + oy) for px, py in pts], fill=v, width=width)
        return img

    bundles = np.asarray(strokes(1800, (40, 120), 3, (110, 255), 0.18, 0.55).filter(ImageFilter.GaussianBlur(0.9)), np.float32) / 255.0
    fine = np.asarray(strokes(12000, (10, 36), 1, (70, 255), 0.4, 1.1).filter(ImageFilter.GaussianBlur(0.45)), np.float32) / 255.0
    tuft = norm01(fbm(n, n, 8, 6, rng, octaves=3, gain=0.5))
    lumps = norm01(fbm(n, n, 32, 20, rng, octaves=2, gain=0.5))
    cover = np.clip(0.6 * bundles + 0.5 * fine, 0.0, 1.0)
    # the fibre carries the colour; a gap between tufts is a little darker (the cavity behind it) and thinner
    height = np.clip(0.2 + 0.4 * tuft + 0.1 * lumps + 0.35 * cover * (0.5 + 0.5 * tuft), 0.0, 1.0)
    t = 0.3 + 0.24 * smooth(0.05, 0.95, tuft) + 0.06 * lumps + 0.5 * cover * (0.55 + 0.45 * tuft) - 0.16
    albedo = ramp(t, [(0.0, "#1f1c19"), (0.35, "#4a443e"), (0.65, "#6e665d"), (1.0, "#8f877c")])
    return albedo, height


def save(albedo, height, master, web, name, sizes=((2048, "2k"), (1024, "1k"))):
    col = Image.fromarray(lin_to_srgb8(albedo), "RGB")
    hgt = Image.fromarray((np.clip(height, 0, 1) * 255 + 0.5).astype(np.uint8), "L")
    col.save(os.path.join(master, f"{name}-color.png"))
    hgt.save(os.path.join(master, f"{name}-height.png"))
    out = []
    for px, tag in sizes:
        c = col if col.width == px else col.resize((px, px), Image.Resampling.LANCZOS)
        hh = hgt if hgt.width == px else hgt.resize((px, px), Image.Resampling.LANCZOS)
        cp = os.path.join(web, f"{name}-color-{tag}.webp")
        hp = os.path.join(web, f"{name}-height-{tag}.webp")
        c.save(cp, "WEBP", quality=82, method=6)
        hh.convert("RGB").save(hp, "WEBP", quality=86, method=6)
        out += [(cp, os.path.getsize(cp)), (hp, os.path.getsize(hp))]
    return col, out


def main():
    master, web = sys.argv[1], sys.argv[2]
    preview = sys.argv[sys.argv.index("--preview") + 1] if "--preview" in sys.argv else None
    # --only walnut,wadding regenerates just those (each texture has its own seed, so the rest stay byte-identical)
    only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
    want = lambda name: only is None or name in only
    os.makedirs(master, exist_ok=True)
    os.makedirs(web, exist_ok=True)
    report, tiles = [], []
    for name, fn, seed in (("walnut", walnut, 11), ("chalk", chalk, 23), ("graphite", graphite, 37)):
        if not want(name):
            continue
        a, h = fn(SIZE, np.random.default_rng(seed))
        col, out = save(a, h, master, web, name)
        report += out
        tiles.append(col)
        mean = lin_to_srgb8(a.reshape(-1, 3).mean(0))
        print(f"{name}: mean sRGB #{mean[0]:02x}{mean[1]:02x}{mean[2]:02x}")
    for name, fn, seed in (("paper", paper, 5), ("wadding", wadding, 61)):
        if not want(name):
            continue
        a, h = fn(512, np.random.default_rng(seed))
        col, out = save(a, h, master, web, name, sizes=((512, "512"),))
        report += out
        mean = lin_to_srgb8(a.reshape(-1, 3).mean(0))
        print(f"{name}: mean sRGB #{mean[0]:02x}{mean[1]:02x}{mean[2]:02x}")
    for p, s in report:
        print(f"{os.path.basename(p)} {s // 1024} KB")
    if preview and tiles:
        # top row: whole texture; bottom row: 1:1 crop (about 140 mm of wood)
        sheet = Image.new("RGB", (3 * 512, 1024), (16, 14, 12))
        for i, t in enumerate(tiles):
            sheet.paste(t.resize((512, 512), Image.Resampling.LANCZOS), (i * 512, 0))
            sheet.paste(t.crop((700, 700, 1212, 1212)), (i * 512, 512))
        sheet.save(preview)


if __name__ == "__main__":
    main()
