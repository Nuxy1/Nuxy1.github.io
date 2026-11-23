# pyright: reportMissingImports=false
"""Sample Blender's AgX "Medium High Contrast" view so three.js can match the posters' colour transform.

Run inside Blender 5.2 (its bundled OCIO config is the reference):
  blender -b --factory-startup --python-exit-code 1 -P scripts/halvane/agx_mhc_sample.py -- --out <samples.json>

Writes {"grey": [[log2 exposure, display value], ...241], "col": [[linear rgb, display rgb], ...48]}:
  grey  a neutral ramp over the 16.5 stops AgX covers (log2 -12.47 to +4.03), the curve agx_mhc_lut.mjs fits;
  col   48 test colours (the walnut base colours, ivory, ash, near-black and 40 seeded random colours) used only to
        measure how close the fitted live tone map lands.
"""
import argparse
import json
import os
import random
import sys

import bpy
import PyOpenColorIO as OCIO

LOOK = "AgX - Medium High Contrast"
LOG_MIN, LOG_RANGE, STEPS = -12.47393, 16.5, 240


def processor(cfg, look):
    vp = OCIO.LegacyViewingPipeline()
    vp.setDisplayViewTransform(OCIO.DisplayViewTransform(src="Linear Rec.709", display="sRGB", view="AgX"))
    if look:
        vp.setLooksOverrideEnabled(True)
        vp.setLooksOverride(look)
    return vp.getProcessor(cfg).getDefaultCPUProcessor()


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    version = f"{bpy.app.version[0]}.{bpy.app.version[1]}"
    path = os.path.join(os.path.dirname(bpy.app.binary_path), version, "datafiles", "colormanagement", "config.ocio")
    p = processor(OCIO.Config.CreateFromFile(path), LOOK)

    out = {"grey": [], "col": []}
    for i in range(STEPS + 1):
        stop = LOG_MIN + LOG_RANGE * i / STEPS
        g = 2 ** stop
        out["grey"].append([stop, p.applyRGB([g, g, g])[0]])

    random.seed(7)
    cols = [[0.112, 0.0497, 0.0242], [0.05, 0.022, 0.011], [0.3, 0.13, 0.06], [0.6, 0.55, 0.48],
            [0.2747, 0.2462, 0.2051], [0.45, 0.36, 0.22], [0.02, 0.018, 0.016], [0.9, 0.85, 0.78]]
    for _ in range(40):
        b = 2 ** random.uniform(-7, 1.5)
        cols.append([b * random.uniform(0.25, 1) for _ in range(3)])
    for c in cols:
        out["col"].append([c, p.applyRGB(c)])

    with open(args.out, "w") as f:
        json.dump(out, f)
    print(f"agx_mhc_sample: {len(out['grey'])} grey, {len(out['col'])} colours -> {args.out}")


main()
