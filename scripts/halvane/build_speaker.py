"""Lumen One, the canonical model: built, lit and rendered in Blender 5.2 (Cycles).

Every product image and the web GLB come from this one script, so the speaker
on the page, in the posters and in the stills is the same object.

  blender -b --factory-startup -P build_speaker.py -- --tex <dir> --font <ttf>
          --out <dir> [--views hero,front,macro,side,rear,exploded]
          [--res 1440x900] [--samples 160] [--finish walnut|chalk|graphite]
          [--preview] [--no-render] [--tag <suffix>] [--shadow <png>] [--glb <glb>]
          [--posters reveal,... [--poster-size 1600] [--cameras <json>] [--poster-shadow <png>]]

Units are metres, Z up, the front faces -Y (glTF +Z after export).
Dimensions are the product facts: 21 x 33 x 26 cm cabinet in 19 mm walnut,
6.5-inch woofer, 1-inch dome tweeter in a shallow waveguide with a brass ring,
slot port, brass binding posts on the back plate, crossover behind it.
Renders go to <out>/renders/<finish>-<view><tag>.png, the scene to
<out>/lumen-one.blend.
"""
import argparse
import math
import os
import sys
import time

import bmesh
import bpy
from mathutils import Matrix, Vector

# ---------------------------------------------------------------- dimensions
W, H, D = 0.21, 0.33, 0.26
FOOT = 0.004
Z0 = FOOT + H / 2
YF, YB = -D / 2, D / 2
WALL = 0.019
BEV = 0.008
ZT = Z0 + 0.108       # tweeter axis
ZW = Z0 - 0.035       # woofer axis
ZP = Z0 - 0.143       # slot port centre line
ZPLATE = 0.130        # rear plate centre
S = 0.55              # metres of cabinet per texture repeat (textures.py)


def parse():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--tex", required=True)
    p.add_argument("--font", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--views", default="hero,front,macro,side,rear,exploded")
    p.add_argument("--res", default="1440x900")
    p.add_argument("--samples", type=int, default=160)
    p.add_argument("--finish", default="walnut", choices=("walnut", "chalk", "graphite"))
    p.add_argument("--preview", action="store_true")
    p.add_argument("--no-render", action="store_true")
    p.add_argument("--tag", default="")
    p.add_argument("--shadow", default="", help="bake the web contact shadow (RGBA PNG) to this path")
    p.add_argument("--posters", default="", help="camera states from --cameras to render as transparent square stills, e.g. reveal,silhouette")
    p.add_argument("--cameras", default="", help="the shared cameras.json (default: src/lib/halvane/cameras.json next to this script's site)")
    p.add_argument("--poster-size", type=int, default=1600)
    p.add_argument("--rim-k", type=int, default=0, help="test override: rim and kicker colour temperature (K)")
    p.add_argument("--rim-w", type=float, default=1.0, help="test override: rim power multiplier")
    p.add_argument("--rim-pos", default="", help="test override: rim position x,y,z (Blender metres)")
    p.add_argument("--poster-shadow", default="", help="the baked contact shadow PNG laid under the posters (default: <out>/web/shadow.png)")
    p.add_argument("--glb", default="", help="export the web model (geometry + PBR values, no textures) to this .glb")
    return p.parse_args(argv)


# ---------------------------------------------------------------- helpers
def srgb_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexlin(h):
    return tuple(srgb_lin(int(h[i:i + 2], 16) / 255.0) for i in (1, 3, 5)) + (1.0,)


def kelvin(k):
    """Tanner Helland's blackbody fit, returned as linear RGB."""
    t = k / 100.0
    r = 255.0 if t <= 66 else 329.698727446 * (t - 60) ** -0.1332047592
    g = (99.4708025861 * math.log(t) - 161.1195681661) if t <= 66 else 288.1221695283 * (t - 60) ** -0.0755148492
    b = 255.0 if t >= 66 else (0.0 if t <= 19 else 138.5177312231 * math.log(t - 10) - 305.0447927307)
    return tuple(srgb_lin(min(max(c, 0.0), 255.0) / 255.0) for c in (r, g, b))


def T(x, y, z):
    return Matrix.Translation((x, y, z))


def RX(deg):
    return Matrix.Rotation(math.radians(deg), 4, "X")


def RZ(deg):
    return Matrix.Rotation(math.radians(deg), 4, "Z")


def lathe(bm, prof, seg=96, matrix=None, closed=False, uvu=1.0, uvs=0.05, mats=None):
    """Revolve a (r, y[, shape]) profile around the Y axis. r = 0 makes a pole.

    shape 'hex' gives a hexagon of inscribed radius r (seg must be a multiple
    of 6), 'flute' 24 shallow flutes. UVs: u around, v along the profile.
    """
    uvl = bm.loops.layers.uv.verify()
    pts = [(p[0], p[1], p[2] if len(p) > 2 else None) for p in prof]
    n = len(pts)
    s = [0.0]
    for i in range(1, n):
        s.append(s[-1] + math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
    s_close = s[-1] + math.hypot(pts[0][0] - pts[-1][0], pts[0][1] - pts[-1][1])
    rings, newv = [], []
    for r, y, shape in pts:
        if r <= 1e-9:
            v = bm.verts.new((0.0, y, 0.0))
            rings.append(v)
            newv.append(v)
            continue
        ring = []
        for j in range(seg):
            t = 2 * math.pi * j / seg
            rr = r
            if shape == "hex":
                rr = r / math.cos(((t + math.pi / 6) % (math.pi / 3)) - math.pi / 6)
            elif shape == "flute":
                rr = r * (1 - 0.05 * (0.5 - 0.5 * math.cos(24 * t)))
            ring.append(bm.verts.new((rr * math.cos(t), y, rr * math.sin(t))))
        rings.append(ring)
        newv += ring
    pairs = [(i, i + 1, s[i], s[i + 1]) for i in range(n - 1)]
    if closed:
        pairs.append((n - 1, 0, s[n - 1], s_close))
    faces = []
    for k, (a, b, sa, sb) in enumerate(pairs):
        A, B = rings[a], rings[b]
        mi = mats[k] if mats else 0
        for j in range(seg):
            j1 = j + 1
            ua, ub = j / seg * uvu, j1 / seg * uvu
            if isinstance(A, list) and isinstance(B, list):
                vs = [A[j], A[j1 % seg], B[j1 % seg], B[j]]
                uv = [(ua, sa / uvs), (ub, sa / uvs), (ub, sb / uvs), (ua, sb / uvs)]
            elif isinstance(A, list):
                vs = [A[j], A[j1 % seg], B]
                uv = [(ua, sa / uvs), (ub, sa / uvs), ((j + 0.5) / seg * uvu, sb / uvs)]
            elif isinstance(B, list):
                vs = [A, B[j1 % seg], B[j]]
                uv = [((j + 0.5) / seg * uvu, sa / uvs), (ub, sb / uvs), (ua, sb / uvs)]
            else:
                continue
            try:
                f = bm.faces.new(vs)
            except ValueError:
                continue
            f.material_index = mi
            f.smooth = True
            for loop, c in zip(f.loops, uv):
                loop[uvl].uv = c
            faces.append(f)
    if matrix is not None:
        bmesh.ops.transform(bm, matrix=matrix, verts=newv)
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return faces


def rrect(cx, cz, hw, hh, rad, cseg=8):
    rad = max(min(rad, hw, hh), 0.0006)
    pts = []
    for ox, oz, a0 in ((hw - rad, hh - rad, 0), (-(hw - rad), hh - rad, 90),
                       (-(hw - rad), -(hh - rad), 180), (hw - rad, -(hh - rad), 270)):
        for k in range(cseg + 1):
            a = math.radians(a0 + 90 * k / cseg)
            pts.append((cx + ox + rad * math.cos(a), cz + oz + rad * math.sin(a)))
    out = [pts[0]]
    for p in pts[1:]:
        if (p[0] - out[-1][0]) ** 2 + (p[1] - out[-1][1]) ** 2 > 1e-14:
            out.append(p)
    if (out[0][0] - out[-1][0]) ** 2 + (out[0][1] - out[-1][1]) ** 2 < 1e-14:
        out.pop()
    return out


def sweep(bm, cx, cz, hw, hh, rad, rows, cseg=8, mats=None, uvscale=0.1):
    """Rounded-rectangle rings along Y; rows are (outset, y). Capped both ends."""
    uvl = bm.loops.layers.uv.verify()
    loops = []
    for off, y in rows:
        loops.append([bm.verts.new((x, y, z)) for x, z in rrect(cx, cz, hw + off, hh + off, rad + off, cseg)])
    m = len(loops[0])
    assert all(len(lp) == m for lp in loops), "sweep rows differ in point count"
    faces = []
    for i in range(len(loops) - 1):
        A, B = loops[i], loops[i + 1]
        for j in range(m):
            f = bm.faces.new([A[j], A[(j + 1) % m], B[(j + 1) % m], B[j]])
            f.material_index = mats[i] if mats else 0
            f.smooth = True
            faces.append(f)
    for lp, mi in ((loops[0], mats[0] if mats else 0), (loops[-1], mats[-1] if mats else 0)):
        f = bm.faces.new(lp)
        f.material_index = mi
        faces.append(f)
    for f in faces:
        for loop in f.loops:
            co = loop.vert.co
            loop[uvl].uv = (co.x / uvscale, co.z / uvscale)
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return faces


def box(bm, center, size, matrix=None, mi=0):
    M = T(*center) @ Matrix.Diagonal((size[0], size[1], size[2], 1.0))
    if matrix is not None:
        M = matrix @ M
    r = bmesh.ops.create_cube(bm, size=1.0, matrix=M)
    uvl = bm.loops.layers.uv.verify()
    fs = {f for v in r["verts"] for f in v.link_faces}
    for f in fs:
        f.material_index = mi
        for loop in f.loops:
            co = loop.vert.co
            loop[uvl].uv = (co.x * 20 + co.y * 20, co.z * 20)
    return r["verts"]


# ---------------------------------------------------------------- scene objects
COL = None


def mk(name, bm, mats, parent, sharp=35):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats if isinstance(mats, (list, tuple)) else [mats]:
        me.materials.append(m)
    if sharp:
        try:
            me.set_sharp_from_angle(angle=math.radians(sharp))
        except Exception:
            pass
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    ob.parent = parent
    return ob


def empty(name, parent=None):
    ob = bpy.data.objects.new(name, None)
    COL.objects.link(ob)
    ob.parent = parent
    return ob


# ---------------------------------------------------------------- materials
MAT = {}


def bsdf_mat(name, color, rough, metallic=0.0, spec=None, coat=0.0, coat_rough=0.1,
             aniso=0.0, tangent=None, sheen=0.0):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    i = b.inputs
    i["Base Color"].default_value = hexlin(color) if isinstance(color, str) else tuple(color) + (1.0,)
    i["Roughness"].default_value = rough
    i["Metallic"].default_value = metallic
    if spec is not None:
        i["Specular IOR Level"].default_value = spec
    if coat:
        i["Coat Weight"].default_value = coat
        i["Coat Roughness"].default_value = coat_rough
    if aniso:
        i["Anisotropic"].default_value = aniso
        tn = nt.nodes.new("ShaderNodeTangent")
        if tangent == "radial":
            tn.direction_type = "RADIAL"
            tn.axis = "Y"
        else:
            tn.direction_type = "UV_MAP"
        nt.links.new(tn.outputs["Tangent"], i["Tangent"])
    if sheen:
        i["Sheen Weight"].default_value = sheen
    m.diffuse_color = hexlin(color) if isinstance(color, str) else tuple(color) + (1.0,)
    MAT[name] = m
    return m, nt, b


def image(path, data):
    im = bpy.data.images.load(path, check_existing=True)
    im.colorspace_settings.name = "Non-Color" if data else "sRGB"
    return im


def textured(nt, b, tex, name, bump, rough_lo, rough_hi, uvscale=None, coat_bump=False):
    N, L = nt.nodes, nt.links
    tc = N.new("ShaderNodeTexCoord")
    vec = tc.outputs["UV"]
    if uvscale:
        mp = N.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (uvscale, uvscale, 1.0)
        L.new(vec, mp.inputs["Vector"])
        vec = mp.outputs["Vector"]
    col = N.new("ShaderNodeTexImage")
    col.image = image(os.path.join(tex, f"{name}-color.png"), False)
    col.interpolation = "Cubic"
    hgt = N.new("ShaderNodeTexImage")
    hgt.image = image(os.path.join(tex, f"{name}-height.png"), True)
    hgt.interpolation = "Cubic"
    L.new(vec, col.inputs["Vector"])
    L.new(vec, hgt.inputs["Vector"])
    L.new(col.outputs["Color"], b.inputs["Base Color"])
    mr = N.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = 0.1
    mr.inputs["From Max"].default_value = 0.72
    mr.inputs["To Min"].default_value = rough_lo
    mr.inputs["To Max"].default_value = rough_hi
    L.new(hgt.outputs["Color"], mr.inputs["Value"])
    L.new(mr.outputs["Result"], b.inputs["Roughness"])
    bp = N.new("ShaderNodeBump")
    bp.inputs["Distance"].default_value = bump
    bp.inputs["Strength"].default_value = 1.0
    L.new(hgt.outputs["Color"], bp.inputs["Height"])
    L.new(bp.outputs["Normal"], b.inputs["Normal"])
    if coat_bump:
        L.new(bp.outputs["Normal"], b.inputs["Coat Normal"])


WOOD = {  # finish: top roughness, pore roughness, coat, coat roughness, bump, coat follows pores
    "walnut": (0.42, 0.72, 0.18, 0.32, 0.00014, True),
    "chalk": (0.48, 0.62, 0.35, 0.45, 0.00025, False),
    "graphite": (0.40, 0.66, 0.25, 0.30, 0.0004, True),
}


def build_materials(tex):
    for fin, (top, pore, coat, crough, bump, cb) in WOOD.items():
        _, nt, b = bsdf_mat(f"wood_{fin}", "#5e3f2b", top, coat=coat, coat_rough=crough)
        textured(nt, b, tex, fin, bump, pore, top, coat_bump=cb)
    bsdf_mat("port", "#0c0b0a", 0.9)
    bsdf_mat("cast", "#2a2826", 0.55)
    bsdf_mat("steel", (0.24, 0.235, 0.23), 0.32, metallic=1.0)
    bsdf_mat("alu", (0.60, 0.59, 0.57), 0.36, metallic=1.0, aniso=0.8, tangent="radial")
    bsdf_mat("alu_dark", (0.11, 0.105, 0.1), 0.4, metallic=1.0, aniso=0.6, tangent="radial")
    bsdf_mat("rubber", "#151413", 0.75, spec=0.3)
    _, nt, b = bsdf_mat("paper", "#34302c", 0.82)
    textured(nt, b, tex, "paper", 0.0002, 0.86, 0.78)
    _, nt, b = bsdf_mat("dustcap", "#1f1c1a", 0.5, coat=0.6, coat_rough=0.35)
    N = nt.nodes
    hgt = N.new("ShaderNodeTexImage")
    hgt.image = image(os.path.join(tex, "paper-height.png"), True)
    bp = N.new("ShaderNodeBump")
    bp.inputs["Distance"].default_value = 0.00015
    nt.links.new(N.new("ShaderNodeTexCoord").outputs["UV"], hgt.inputs["Vector"])
    nt.links.new(hgt.outputs["Color"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    bsdf_mat("spider", "#a08a62", 0.9, sheen=0.3)
    bsdf_mat("brass", (0.67, 0.45, 0.19), 0.3, metallic=1.0)
    bsdf_mat("dome", "#b8b6b2", 0.35, metallic=1.0)
    bsdf_mat("plate", "#2f2d2b", 0.34, metallic=1.0, aniso=0.6, tangent="uv")
    bsdf_mat("label", "#9a9892", 0.4, metallic=1.0)
    bsdf_mat("print", "#d8d1c4", 0.55)
    bsdf_mat("feet", "#1a1816", 0.7, spec=0.35)
    bsdf_mat("pcb", "#1b1d1a", 0.5)
    bsdf_mat("copper", (0.95, 0.64, 0.54), 0.3, metallic=1.0)
    bsdf_mat("cap_film", "#857350", 0.45)
    bsdf_mat("ceramic", "#d8d2c4", 0.6)
    bsdf_mat("epoxy", "#4a3519", 0.3)  # the film caps' sealed ends
    bsdf_mat("ink", "#1c1814", 0.6)  # print on the crossover parts
    # undyed grey wool: textures.py's carded fibre (one repeat per 0.2 m, build_wadding's UVs) sets its colour and
    # its tufts; the bump stays shallow, as the mesh already carries the lumps
    _, nt, b = bsdf_mat("wadding", "#5f5850", 1.0, sheen=0.5)
    textured(nt, b, tex, "wadding", 0.0008, 1.0, 0.9)
    bsdf_mat("solder", "#c4c1ba", 0.32, metallic=1.0)
    # studio floor: dark, warm, a soft broken reflection
    _, nt, b = bsdf_mat("floor", (0.0045, 0.0042, 0.0039), 0.9, spec=0.06)
    N, L = nt.nodes, nt.links
    nz = N.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 3.0
    nz.inputs["Detail"].default_value = 6.0
    mr = N.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value = 0.82
    mr.inputs["To Max"].default_value = 0.95
    L.new(nz.outputs["Fac"], mr.inputs["Value"])
    L.new(mr.outputs["Result"], b.inputs["Roughness"])


# ---------------------------------------------------------------- cabinet
def shell_depth(c):
    """How far a point lies inside the cabinet's outer skin, in metres (the negated signed distance to the
    rounded box). The skin's own faces sit within ~0.1 mm of 0 (8-segment chords); cut faces sit deeper.
    A per-axis box test is not enough: the middle faces of each bevelled corner sit 3.4 mm in on all three
    axes, so they read as 'inside' and took the dark port finish (a black fleck on all eight corners)."""
    q = (abs(c.x) - (W / 2 - BEV), abs(c.y) - (D / 2 - BEV), abs(c.z - Z0) - (H / 2 - BEV))
    return BEV - math.sqrt(sum(max(v, 0.0) ** 2 for v in q)) - min(max(q), 0.0)


SKIN = 0.0003  # deeper than this is a cut face, not the outer skin


def cabinet_uvs(me):
    bm = bmesh.new()
    bm.from_mesh(me)
    uvl = bm.loops.layers.uv.verify()
    a, b, r = W / 2, H / 2, BEV
    sa, sb, q = a - r, b - r, math.pi * r / 2
    P = 4 * sa + 4 * sb + 4 * q

    def perim(x, z):
        if x > sa and z < -sb:
            return sa + r * (math.atan2(z + sb, x - sa) + math.pi / 2)
        if x > sa and z > sb:
            return sa + q + 2 * sb + r * math.atan2(z - sb, x - sa)
        if x < -sa and z > sb:
            return 3 * sa + 2 * q + 2 * sb + r * (math.atan2(z - sb, x + sa) - math.pi / 2)
        if x < -sa and z < -sb:
            phi = math.atan2(z + sb, x + sa)
            if phi < 0:
                phi += 2 * math.pi
            return 3 * sa + 3 * q + 4 * sb + r * (phi - math.pi)
        if abs(z) <= sb and abs(x) > sa:
            return sa + q + (z + sb) if x > 0 else 3 * sa + 3 * q + 2 * sb + (sb - z)
        return x if z < 0 else sa + 2 * q + 2 * sb + (sa - x)

    for f in bm.faces:
        n, c = f.normal, f.calc_center_median()
        hole = shell_depth(c) > SKIN and abs(c.y) > D / 2 - 0.03
        if abs(n.y) > 0.7 or hole:
            back = c.y > 0
            for loop in f.loops:
                co = loop.vert.co
                u = (co.z - Z0) / S + (0.57 if back else 0.13)
                v = (-co.x if back else co.x) / S + (0.08 if back else 0.41)
                loop[uvl].uv = (u, v)
        else:
            ss = [perim(lp.vert.co.x, lp.vert.co.z - Z0) for lp in f.loops]
            if max(ss) - min(ss) > P / 2:
                ss = [s + P if s < P / 2 else s for s in ss]
            for loop, s in zip(f.loops, ss):
                # grain runs round the wrap: vertical on the sides like the front
                loop[uvl].uv = (s / S + 0.21, loop.vert.co.y / S + 0.33)
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(me)
    bm.free()


def build_cabinet(root, wood):
    grp = empty("Cabinet", root)
    port = MAT["port"]
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=T(0, 0, Z0) @ Matrix.Diagonal((W, D, H, 1.0)))
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=BEV, offset_type="OFFSET", segments=8,
                    profile=0.5, affect="EDGES", clamp_overlap=True)
    cab = mk("cabinet", bm, [wood, port], grp, sharp=0)

    cut_col = bpy.data.collections.new("Cutters")
    bpy.context.scene.collection.children.link(cut_col)

    def cutter(name, fill):
        b2 = bmesh.new()
        fill(b2)
        me = bpy.data.meshes.new(name)
        b2.to_mesh(me)
        b2.free()
        me.materials.append(wood)
        me.materials.append(port)
        ob = bpy.data.objects.new(name, me)
        cut_col.objects.link(ob)
        ob.hide_render = True
        return ob

    cutter("cut_cavity", lambda b2: box(b2, (0, 0, Z0), (W - 2 * WALL, D - 2 * WALL, H - 2 * WALL), mi=1))
    cutter("cut_woofer", lambda b2: lathe(b2, [
        (0, YF - 0.01), (0.0865, YF - 0.01), (0.0865, YF), (0.0855, YF + 0.001), (0.0855, YF + 0.0045),
        (0.0705, YF + 0.0045), (0.0705, YF + 0.04), (0, YF + 0.04)],
        seg=128, matrix=T(0, 0, ZW), mats=[0, 0, 0, 0, 0, 1, 1]))
    cutter("cut_tweeter", lambda b2: lathe(b2, [
        (0, YF - 0.01), (0.0435, YF - 0.01), (0.0435, YF), (0.0425, YF + 0.001), (0.0425, YF + 0.0035),
        (0.027, YF + 0.0035), (0.027, YF + 0.04), (0, YF + 0.04)],
        seg=96, matrix=T(0, 0, ZT), mats=[0, 0, 0, 0, 0, 1, 1]))
    rho = 0.004
    rows = [(rho + 0.003, YF - 0.01), (rho, YF)]
    for k in range(1, 7):
        d = rho * k / 6
        rows.append((rho - math.sqrt(max(rho * rho - (rho - d) ** 2, 0.0)), YF + d))
    rows.append((0.0, YF + 0.04))
    cutter("cut_port", lambda b2: sweep(b2, 0, ZP, 0.075, 0.007, 0.007, rows,
                                        mats=[0] * (len(rows) - 2) + [1]))
    cutter("cut_plate", lambda b2: sweep(b2, 0, ZPLATE, 0.060, 0.075, 0.010, [
        (0.0043, YB + 0.01), (0.0013, YB), (0.0005, YB - 0.0008), (0.0005, YB - 0.0030),
        (-0.012, YB - 0.0030), (-0.012, YB - 0.03)], mats=[0, 0, 0, 0, 1]))

    mod = cab.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.operand_type = "COLLECTION"
    mod.collection = cut_col
    mod.solver = "EXACT"
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(cab.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    cab.modifiers.remove(mod)
    old = cab.data
    cab.data = me
    bpy.data.meshes.remove(old)
    for ob in list(cut_col.objects):
        bpy.data.meshes.remove(ob.data)
    bpy.data.collections.remove(cut_col)
    me.materials.clear()
    me.materials.append(wood)
    me.materials.append(port)
    # The boolean does not keep the cutters' material indices, so assign by place:
    # anything deeper than the driver rebates (front) or the plate pocket (back),
    # and inside the outer shell, is the dark port/cavity finish.
    for poly in me.polygons:
        c = poly.center
        poly.material_index = 1 if shell_depth(c) > SKIN and YF + 0.0046 < c.y < YB - 0.0031 else 0

    cabinet_uvs(me)
    me.set_sharp_from_angle(angle=math.radians(30))
    wn = cab.modifiers.new("wn", "WEIGHTED_NORMAL")
    wn.mode = "FACE_AREA"
    wn.keep_sharp = True
    wn.weight = 50
    dg = bpy.context.evaluated_depsgraph_get()
    me2 = bpy.data.meshes.new_from_object(cab.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    cab.modifiers.remove(wn)
    cab.data = me2
    bpy.data.meshes.remove(me)
    cab.data.name = "cabinet"

    # feet: four soft discs
    bm = bmesh.new()
    for x in (-0.08, 0.08):
        for y in (-0.105, 0.105):
            lathe(bm, [(0, 0), (0.0095, 0), (0.0102, 0.0006), (0.0102, FOOT), (0, FOOT)],
                  seg=48, matrix=T(x, y, 0) @ RX(90))
    mk("feet", bm, MAT["feet"], grp)
    return grp


# ---------------------------------------------------------------- drivers
def screw_profile(y0, sgn):
    p = [(0, y0), (0.0028, y0), (0.0028, y0 - sgn * 0.00035)]
    for k in range(1, 7):
        t = math.pi / 2 * k / 6
        p.append((0.00135 + 0.00145 * math.cos(t), y0 - sgn * (0.00035 + 0.00125 * math.sin(t))))
    p += [(0.00075, y0 - sgn * 0.0016, "hex"), (0.00075, y0 - sgn * 0.0008, "hex"), (0, y0 - sgn * 0.0008)]
    return p


def build_woofer(root):
    grp = empty("Woofer", root)
    y0 = YF
    M = T(0, 0, ZW)

    bm = bmesh.new()  # cast flange + spokes + motor
    lathe(bm, [(0.0648, y0 + 0.0062), (0.0648, y0 + 0.0003), (0.0652, y0), (0.0836, y0),
               (0.0846, y0 + 0.0004), (0.0850, y0 + 0.0014), (0.0850, y0 + 0.0045),
               (0.0700, y0 + 0.0045), (0.0690, y0 + 0.0062)], seg=128, matrix=M, closed=True)
    for k in range(4):
        a = math.radians(45 + 90 * k)
        p0 = Vector((0.068 * math.cos(a), y0 + 0.005, 0.068 * math.sin(a)))
        p1 = Vector((0.040 * math.cos(a), y0 + 0.048, 0.040 * math.sin(a)))
        d = p1 - p0
        R = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
        rv = bmesh.ops.create_cube(bm, size=1.0, matrix=M @ T(*((p0 + p1) / 2)) @ R @ Matrix.Diagonal((0.010, 0.003, d.length, 1.0)))
        for v in rv["verts"]:
            for f in v.link_faces:
                f.smooth = False
    lathe(bm, [(0, y0 + 0.048), (0.042, y0 + 0.048), (0.042, y0 + 0.052), (0.046, y0 + 0.052),
               (0.046, y0 + 0.066), (0.042, y0 + 0.066), (0.042, y0 + 0.070), (0.008, y0 + 0.070),
               (0.008, y0 + 0.050), (0, y0 + 0.050)], seg=96, matrix=M)
    mk("woofer_frame", bm, MAT["cast"], grp)

    bm = bmesh.new()
    for k in range(6):
        a = math.radians(30 + 60 * k)
        lathe(bm, screw_profile(y0, 1), seg=36, matrix=M @ T(0.0778 * math.cos(a), 0, 0.0778 * math.sin(a)))
    mk("woofer_screws", bm, MAT["steel"], grp)

    bm = bmesh.new()
    lathe(bm, [(0.0636, y0), (0.0636, y0 - 0.0008), (0.0640, y0 - 0.0012), (0.0646, y0 - 0.0014),
               (0.0712, y0 - 0.0014), (0.0718, y0 - 0.0012), (0.0722, y0 - 0.0008), (0.0722, y0)],
          seg=128, matrix=M, closed=True)
    mk("woofer_trim", bm, MAT["alu"], grp)

    rc, a_, b_, ys = 0.05925, 0.00475, 0.0035, y0 - 0.0001
    prof = [(0.0652, ys)]
    for k in range(0, 17):
        t = math.pi * k / 16
        prof.append((rc + a_ * math.cos(t), ys - b_ * math.sin(t)))
    prof += [(0.0538, ys), (0.0538, ys + 0.0007)]
    for k in range(16, -1, -1):
        t = math.pi * k / 16
        prof.append((rc + (a_ - 0.0007) * math.cos(t), ys + 0.0007 - (b_ - 0.0007) * math.sin(t)))
    prof.append((0.0652, ys + 0.0007))
    bm = bmesh.new()
    lathe(bm, prof, seg=128, matrix=M, closed=True)
    mk("woofer_surround", bm, MAT["rubber"], grp)

    yc0, yc1 = ys + 0.0007, y0 + 0.026
    front = [(0.054 - 0.0335 * (k / 20), yc0 + (yc1 - yc0) * (k / 20) ** 1.35) for k in range(21)]
    back = [(r, y + 0.0007) for r, y in reversed(front)]
    bm = bmesh.new()
    lathe(bm, front + back, seg=128, matrix=M, closed=True, uvu=4, uvs=0.06)
    mk("woofer_cone", bm, MAT["paper"], grp)

    R, c, h = 0.03457, 0.0215, 0.0075
    apex = y0 + 0.0255 - h
    phimax = math.asin(c / R)
    cap = [(R * math.sin(phimax * k / 16), apex + R * (1 - math.cos(phimax * k / 16))) for k in range(17)]
    capb = [(r, y + 0.0006) for r, y in reversed(cap)]
    bm = bmesh.new()
    lathe(bm, cap + capb, seg=96, matrix=M, uvu=2, uvs=0.04)
    mk("woofer_dustcap", bm, MAT["dustcap"], grp)

    bm = bmesh.new()
    sp = [(0.0165 + (0.047 - 0.0165) * k / 40, y0 + 0.037 + 0.0015 * math.sin(10 * math.pi * k / 40)) for k in range(41)]
    lathe(bm, sp + [(r, y + 0.0005) for r, y in reversed(sp)], seg=96, matrix=M, closed=True)
    lathe(bm, [(0.0160, y0 + 0.025), (0.0168, y0 + 0.025), (0.0168, y0 + 0.050), (0.0160, y0 + 0.050)],
          seg=64, matrix=M, closed=True)
    mk("woofer_spider", bm, MAT["spider"], grp)
    return grp


def build_tweeter(root):
    grp = empty("Tweeter", root)
    y0 = YF
    M = T(0, 0, ZT)
    prof = [(0.0178, y0 + 0.0055)]
    for k in range(1, 13):
        t = k / 12
        prof.append((0.0178 + 0.0162 * t, y0 + 0.0055 * (1 - t) ** 2))
    prof += [(0.0405, y0), (0.0415, y0 + 0.0003), (0.0420, y0 + 0.0010), (0.0420, y0 + 0.0035),
             (0.0262, y0 + 0.0035), (0.0262, y0 + 0.0068), (0.0178, y0 + 0.0068)]
    bm = bmesh.new()
    lathe(bm, prof, seg=128, matrix=M, closed=True)
    mk("tweeter_waveguide", bm, MAT["alu_dark"], grp)

    bm = bmesh.new()
    lathe(bm, [(0.0145, y0 + 0.0062), (0.0145, y0 + 0.0048), (0.0150, y0 + 0.0041), (0.0161, y0 + 0.0038),
               (0.0172, y0 + 0.0041), (0.0178, y0 + 0.0048), (0.0178, y0 + 0.0062)],
          seg=128, matrix=M, closed=True)
    mk("tweeter_ring", bm, MAT["brass"], grp)

    rc, a_, b_, base = 0.0136, 0.0009, 0.0008, y0 + 0.0058
    prof = [(rc + a_ * math.cos(math.pi * k / 12), base - b_ * math.sin(math.pi * k / 12)) for k in range(13)]
    prof += [(rc + (a_ - 0.0003) * math.cos(math.pi * k / 12), base + 0.0003 - (b_ - 0.0003) * math.sin(math.pi * k / 12))
             for k in range(12, -1, -1)]
    bm = bmesh.new()
    lathe(bm, prof, seg=96, matrix=M, closed=True)
    mk("tweeter_surround", bm, MAT["rubber"], grp)

    R, c, h = 0.01644, 0.0127, 0.006
    apex = y0 + 0.0058 - h
    phimax = math.asin(c / R)
    dome = [(R * math.sin(phimax * k / 20), apex + R * (1 - math.cos(phimax * k / 20))) for k in range(21)]
    bm = bmesh.new()
    lathe(bm, dome + [(r, y + 0.0004) for r, y in reversed(dome)], seg=96, matrix=M)
    mk("tweeter_dome", bm, MAT["dome"], grp)

    bm = bmesh.new()
    lathe(bm, [(0, y0 + 0.0068), (0.0258, y0 + 0.0068), (0.0258, y0 + 0.023), (0.024, y0 + 0.025), (0, y0 + 0.025)],
          seg=64, matrix=M)
    mk("tweeter_can", bm, MAT["cast"], grp)
    return grp


# ---------------------------------------------------------------- rear
def label(text, size, x, z, tracking, font, parent, mat="label", matrix=None):
    """Text on the back plate, read from behind; `matrix` places it elsewhere (the text is drawn in XY, facing +Z)."""
    cu = bpy.data.curves.new("lbl", "FONT")
    cu.body = text
    cu.font = font
    cu.size = size
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.space_character = tracking
    cu.resolution_u = 3
    tmp = bpy.data.objects.new("lbl_tmp", cu)
    COL.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    me.transform(matrix if matrix is not None else T(x, YB + 0.00008, z) @ RZ(180) @ RX(90))
    me.materials.append(MAT[mat])
    ob = bpy.data.objects.new("label", me)
    COL.objects.link(ob)
    ob.parent = parent
    return ob


def build_wadding(grp):
    """Acoustic fill seen through the open service door: a lumpy fibre surface 2 cm inside the back wall,
    facing the opening. Only its back-facing skin is modelled, since nothing else of it can be seen."""
    from mathutils import noise
    x0, x1, z0, z1, step = -0.084, 0.084, FOOT + WALL + 0.003, FOOT + H - WALL - 0.003, 0.0035
    nx, nz = int((x1 - x0) / step) + 1, int((z1 - z0) / step) + 1
    bm = bmesh.new()
    vs = []
    for j in range(nz):
        row = []
        for i in range(nx):
            x, z = x0 + (x1 - x0) * i / (nx - 1), z0 + (z1 - z0) * j / (nz - 1)
            d = sum(amp * noise.noise(Vector((x * f, 0.37 * f, z * f))) for f, amp in ((38, 0.006), (95, 0.0024), (210, 0.0009)))
            row.append(bm.verts.new((x, YB - WALL - 0.016 + d, z)))
        vs.append(row)
    for j in range(nz - 1):
        for i in range(nx - 1):
            bm.faces.new((vs[j][i], vs[j + 1][i], vs[j + 1][i + 1], vs[j][i + 1]))
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        f.smooth = True
        for lp in f.loops:
            lp[uv].uv = (lp.vert.co.x / 0.2, lp.vert.co.z / 0.2)
    mk("wadding", bm, MAT["wadding"], grp, sharp=0)


def build_rear(root, font_path):
    grp = empty("Rear", root)
    bm = bmesh.new()
    rows = [(-0.0008 + 0.0008 * math.sin(math.pi / 2 * k / 6), YB - 0.0008 + 0.0008 * math.cos(math.pi / 2 * k / 6))
            for k in range(7)]
    rows.append((0.0, YB - 0.003))
    sweep(bm, 0, ZPLATE, 0.060, 0.075, 0.010, rows, uvscale=0.1)
    mk("rear_plate", bm, MAT["plate"], grp)

    font = bpy.data.fonts.load(font_path, check_existing=True)
    zl = ZPLATE + 0.012
    for text, size, z, tr in (("Halvane", 0.0135, zl + 0.034, 1.12), ("Lumen One", 0.0058, zl + 0.019, 1.18),
                              ("Pair 017 of 200", 0.0042, zl + 0.009, 1.1)):
        label(text, size, 0, z, tr, font, grp)
    zp = ZPLATE - 0.040
    # seen from behind the viewer's right is -X; the red (+) post sits on the viewer's left
    label("+", 0.0090, 0.022, zp + 0.0150, 1.0, font, grp, "print")
    label("−", 0.0090, -0.022, zp + 0.0150, 1.0, font, grp, "print")
    label("6 Ω", 0.0060, 0, zp - 0.0165, 1.1, font, grp, "print")

    bm_w, bm_b = bmesh.new(), bmesh.new()
    for x in (-0.022, 0.022):
        Mp = T(x, 0, zp)
        lathe(bm_w, [(0, 0.130), (0.0095, 0.130), (0.0095, 0.1318), (0.0090, 0.1325), (0, 0.1325)], seg=64, matrix=Mp)
        lathe(bm_b, [(0, 0.1325), (0.0068, 0.1325, "hex"), (0.0068, 0.1385, "hex"), (0.0060, 0.1390),
                     (0.0045, 0.1390), (0.0045, 0.1410), (0.0072, 0.1410, "flute"), (0.0072, 0.1500, "flute"),
                     (0.0066, 0.1508), (0.0021, 0.1508), (0.0021, 0.1470), (0, 0.1470)], seg=96, matrix=Mp)
    mk("post_washers", bm_w, MAT["feet"], grp)
    mk("posts", bm_b, MAT["brass"], grp)

    bm = bmesh.new()
    for sx in (-1, 1):
        for sz in (-1, 1):
            lathe(bm, screw_profile(YB, -1), seg=36, matrix=T(sx * 0.052, 0, ZPLATE + sz * 0.067))
    mk("rear_screws", bm, MAT["steel"], grp)

    # crossover, hand-wired point to point on the inside of the plate. The two air-core coils sit at
    # right angles (one flat, one on edge) so their fields do not couple; the layout is deliberately
    # asymmetric. Board-plane coordinates: x across, z relative to ZPLATE.
    yt = 0.1194  # board's inner surface; parts stand towards -y
    bm = bmesh.new()
    box(bm, (0, 0.1202, ZPLATE), (0.090, 0.0016, 0.110))
    mk("xo_board", bm, MAT["pcb"], grp, sharp=0)
    bm = bmesh.new()
    for sx in (-1, 1):
        for sz in (-1, 1):
            lathe(bm, [(0, 0.121), (0.0028, 0.121), (0.0028, 0.127), (0, 0.127)], seg=32,
                  matrix=T(sx * 0.040, 0, ZPLATE + sz * 0.050))
    for x in (-0.022, 0.022):  # solder lugs where the binding posts come through
        lathe(bm, [(0, yt), (0.0042, yt), (0.0042, yt - 0.0012), (0.0016, yt - 0.0012), (0.0016, yt - 0.0050),
                   (0, yt - 0.0050)], seg=32, matrix=T(x, 0, ZPLATE - 0.040))
    mk("xo_standoffs", bm, MAT["brass"], grp)

    def coil(bm_c, bm_f, ro, width, M, bobbin=True):
        # bobbinless (bonded) coils show their winding rings on the face turned to the viewer (-y)
        prof = [(0.008, -width / 2)]
        if not bobbin:
            nr = int((ro - 0.008) / 0.0007)
            for k in range(1, nr):
                r = 0.008 + (ro - 0.008) * k / nr
                prof += [(r - 0.00035, -width / 2), (r, -width / 2 - 0.00018)]
        n = 40
        for k in range(n + 1):
            y = -width / 2 + width * k / n
            prof.append((ro - 0.0002 * (0.5 - 0.5 * math.cos(2 * math.pi * k / 4)), y))
        prof.append((0.008, width / 2))
        lathe(bm_c, prof, seg=96, matrix=M, closed=True)
        for ya in ((-width / 2 - 0.0015, width / 2) if bobbin else ()):
            lathe(bm_f, [(0.0055, ya), (ro + 0.0009, ya), (ro + 0.0009, ya + 0.0015), (0.0055, ya + 0.0015)],
                  seg=96, matrix=M, closed=True)

    bm_c, bm_f = bmesh.new(), bmesh.new()
    coil(bm_c, bm_f, 0.019, 0.010, T(-0.020, yt - 0.0051, ZPLATE + 0.026), bobbin=False)  # flat
    coil(bm_c, bm_f, 0.014, 0.010, T(0.027, yt - 0.0160, ZPLATE + 0.028) @ RZ(90))    # on edge
    mk("xo_coils", bm_c, MAT["copper"], grp)
    mk("xo_bobbins", bm_f, MAT["feet"], grp)

    def cap(bm, r, half, M):
        lathe(bm, [(0, -half), (r - 0.0005, -half), (r, -half + 0.0005), (r, half - 0.0005), (r - 0.0005, half),
                   (0, half)], seg=48, matrix=M)

    # film caps: wrapped body, sealed ends, a cable tie through the board, the maker's print (no values: the page
    # does not state any). Resistors: cement bodies with the same print. Every part's leads leave the middle of its
    # end faces, run out 2.5 mm and bend down to the board, where the hook-up wire is soldered to them.
    # (radius, half length, placement, tie position along the axis, the tie head's local axis facing the viewer, -y)
    caps = [(0.008, 0.0175, T(-0.010, yt - 0.0081, ZPLATE - 0.010) @ RZ(90), 0.0095, (-1, 0)),  # lying across
            (0.0065, 0.013, T(0.026, yt - 0.0066, ZPLATE - 0.006) @ RX(90), -0.0065, (0, 1))]  # lying upright
    bm, bm_e, bm_t = bmesh.new(), bmesh.new(), bmesh.new()
    for r, half, M, tie, (hx, hz) in caps:
        cap(bm, r, half, M)
        for a, b in ((-half - 0.0003, -half + 0.0002), (half - 0.0002, half + 0.0003)):  # low to high, as cap()
            lathe(bm_e, [(0, a), (r - 0.0014, a), (r - 0.0014, b), (0, b)], seg=32, matrix=M)
        lathe(bm_t, [(r + 0.00005, tie - 0.0013), (r + 0.0006, tie - 0.0013), (r + 0.0006, tie + 0.0013),
                     (r + 0.00005, tie + 0.0013)], seg=48, matrix=M, closed=True)
        out = r + 0.0016  # the tie's locking head, on top where it was pulled tight
        box(bm_t, (hx * out, tie, hz * out), (0.0022 if hx else 0.0034, 0.0028, 0.0022 if hz else 0.0034), matrix=M)
    mk("xo_caps", bm, MAT["cap_film"], grp)
    mk("xo_cap_ends", bm_e, MAT["epoxy"], grp)
    mk("xo_ties", bm_t, MAT["feet"], grp)
    bm = bmesh.new()
    box(bm, (0.008, yt - 0.0046, ZPLATE + 0.020), (0.009, 0.009, 0.022))
    box(bm, (-0.004, yt - 0.0046, ZPLATE - 0.028), (0.022, 0.009, 0.009))
    mk("xo_resistors", bm, MAT["ceramic"], grp, sharp=0)
    up = RX(90) @ RZ(90)  # print reading up the board (seen from inside the cabinet, +x is the viewer's right)
    for text, size, M in (("HALVANE MKP", 0.0024, T(-0.0055, yt - 0.0162, ZPLATE - 0.010) @ RX(90)),
                          ("HALVANE", 0.0021, T(0.026, yt - 0.0132, ZPLATE - 0.0015) @ up),
                          ("HALVANE", 0.0021, T(0.008, yt - 0.0092, ZPLATE + 0.020) @ up),
                          ("HALVANE", 0.0021, T(-0.004, yt - 0.0092, ZPLATE - 0.028) @ RX(90))):
        label(text, size, 0, 0, 1.12, font, grp, "ink", matrix=M)

    # (end on the part's axis, where the lead meets the board, axis height): the lead's two legs
    legs = [((-0.0275, -0.010), (-0.030, -0.010), yt - 0.0081), ((0.0075, -0.010), (0.010, -0.010), yt - 0.0081),
            ((0.026, -0.019), (0.026, -0.0215), yt - 0.0066), ((0.026, 0.007), (0.026, 0.0095), yt - 0.0066),
            ((0.008, 0.009), (0.008, 0.0065), yt - 0.0046), ((0.008, 0.031), (0.008, 0.0335), yt - 0.0046),
            ((-0.015, -0.028), (-0.0175, -0.028), yt - 0.0046), ((0.007, -0.028), (0.0095, -0.028), yt - 0.0046)]
    bm_a, la = bmesh.new(), 0.0009
    for (xe, ze), (xo, zo), ya in legs:
        box(bm_a, ((xe + xo) / 2, ya, ZPLATE + (ze + zo) / 2), (abs(xo - xe) + la, la, abs(zo - ze) + la))
        box(bm_a, (xo, (ya + yt) / 2, ZPLATE + zo), (la, yt - ya, la))
    mk("xo_part_leads", bm_a, MAT["solder"], grp, sharp=0)

    # point-to-point hook-up wire lying on the board, a solder fillet at every joint
    runs = [[(-0.022, -0.040), (-0.022, -0.028), (-0.0175, -0.028)],
            [(0.0095, -0.028), (0.026, -0.028), (0.026, -0.0215)],
            [(0.022, -0.040), (0.036, -0.040), (0.036, 0.0095), (0.026, 0.0095), (0.026, 0.014)],
            [(-0.030, -0.010), (-0.042, -0.010), (-0.042, 0.026), (-0.039, 0.026)],
            [(0.010, -0.010), (0.013, -0.010), (0.013, 0.000), (0.008, 0.000), (0.008, 0.0065)],
            [(-0.001, 0.026), (0.002, 0.026), (0.002, 0.0335), (0.008, 0.0335)],
            [(0.008, 0.0335), (0.008, 0.048), (0.027, 0.048), (0.027, 0.042)]]
    joints = {(0.026, 0.0095)}  # a lead meeting a wire mid-run
    bm_w, bm_s = bmesh.new(), bmesh.new()
    lw, ly = 0.0011, yt - 0.0007
    for run in runs:
        for (xa, za), (xb, zb) in zip(run, run[1:]):
            cx, cz = (xa + xb) / 2, (za + zb) / 2
            box(bm_w, (cx, ly, ZPLATE + cz), (abs(xb - xa) + lw, lw, abs(zb - za) + lw))
        joints |= {run[0], run[-1]}
    for x, z in sorted(joints):  # one fillet per point: two at one spot would z-fight
        lathe(bm_s, [(0, yt), (0.0016, yt), (0.0012, yt - 0.0009), (0, yt - 0.0014)], seg=16,
              matrix=T(x, 0, ZPLATE + z))
    mk("xo_leads", bm_w, MAT["copper"], grp, sharp=0)
    mk("xo_solder", bm_s, MAT["solder"], grp)
    return grp


# ---------------------------------------------------------------- studio
RIM_K = 0
RIM_W = 1.0
RIM_POS = None


def build_studio():
    col = bpy.data.collections.new("Studio")
    bpy.context.scene.collection.children.link(col)
    bm = bmesh.new()
    prof = [(-6.0, 0.0), (1.4, 0.0)]
    for k in range(1, 17):
        t = math.pi / 2 * k / 16
        prof.append((1.4 + math.sin(t), 1.0 - math.cos(t)))
    prof.append((2.4, 5.0))
    left = [bm.verts.new((-6.0, y, z)) for y, z in prof]
    right = [bm.verts.new((6.0, y, z)) for y, z in prof]
    for i in range(len(prof) - 1):
        f = bm.faces.new([left[i], right[i], right[i + 1], left[i + 1]])
        f.smooth = True
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    for f in bm.faces:
        if f.normal.z < -0.01 or f.normal.y > 0.01:
            f.normal_flip()
    me = bpy.data.meshes.new("cyc")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(MAT["floor"])
    ob = bpy.data.objects.new("cyc", me)
    col.objects.link(ob)

    w = bpy.data.worlds.new("studio")
    bpy.context.scene.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    bg = w.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.0032, 0.003, 0.0028, 1.0)
    bg.inputs["Strength"].default_value = 1.0

    # rim and kicker at 4400 K, not warmer: at 3600 K their grazing reflection turned the shaded side of the
    # chalk finish tan and graphite brown, so the finishes read two-toned (rimtest2 sheets, 2026-11-22)
    tgt = Vector((0, 0, 0.17))
    for name, loc, sx, sy, k, pw in (("key", (-1.6, -0.4, 1.2), 1.0, 0.7, 5200, 180.0),
                                     ("rim", RIM_POS or (0.9, 0.9, 0.5), 0.12, 1.5, RIM_K or 4400, 80.0 * RIM_W),
                                     ("kicker", (-0.7, 1.1, 0.9), 0.4, 0.8, RIM_K or 4400, 40.0),
                                     ("fill", (1.5, -1.6, 0.6), 2.0, 2.0, 5000, 9.0)):
        ld = bpy.data.lights.new(name, "AREA")
        ld.shape = "RECTANGLE"
        ld.size, ld.size_y = sx, sy
        ld.energy = pw
        ld.color = kelvin(k)
        lo = bpy.data.objects.new(name, ld)
        col.objects.link(lo)
        lo.location = loc
        lo.rotation_euler = (tgt - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        lo.visible_camera = False
    cam_d = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_d)
    col.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam


# ---------------------------------------------------------------- render
VIEWS = {
    "hero": dict(rot=-35, cam=(0, -1.95, 0.55), tgt=(0, 0, 0.165), lens=85, f=11),
    "front": dict(rot=0, cam=(0, -1.95, 0.20), tgt=(0, 0, 0.165), lens=85, f=11),
    "side": dict(rot=-90, cam=(0, -1.95, 0.40), tgt=(0, 0, 0.165), lens=85, f=11),
    "rear": dict(rot=145, cam=(0, -1.95, 0.55), tgt=(0, 0, 0.165), lens=85, f=11),
    "macro": dict(rot=-22, local=(-0.035, -0.13, 0.205), off=(-0.06, -0.36, 0.12), lens=100, f=4),
    "exploded": dict(rot=-50, cam=(0, -2.6, 0.5), tgt=(0, 0, 0.165), lens=85, f=11, explode=True),
}
EXPLODE = {"Woofer": (0, -0.12, 0), "Tweeter": (0, -0.08, 0)}
HATCH = dict(hinge=(0.060, D / 2), angle=-125.0)  # Blender axes: hinge on the plate's +x edge, turn about z


def setup_render(a):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    try:
        prefs.compute_device_type = "HIP"
        prefs.get_devices()
        used = []
        for d in prefs.devices:
            d.use = d.type == "HIP" and "Radeon(TM) Graphics" not in d.name
            if d.use:
                used.append(d.name)
        sc.cycles.device = "GPU" if used else "CPU"
        print("devices:", used or "CPU")
    except Exception as e:
        print("GPU setup failed, CPU:", e)
        sc.cycles.device = "CPU"
    w, h = (720, 450) if a.preview else tuple(int(v) for v in a.res.split("x"))
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    sc.cycles.samples = 32 if a.preview else a.samples
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.01
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_depth = "8"
    sc.view_settings.view_transform = "AgX"
    for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
        try:
            sc.view_settings.look = look
            break
        except Exception:
            pass
    sc.view_settings.exposure = -0.3


def place(root, groups, cam, v):
    root.rotation_euler = (0, 0, math.radians(v["rot"]))
    for name, g in groups.items():
        g.location = EXPLODE.get(name, (0, 0, 0)) if v.get("explode") else (0, 0, 0)
    if "local" in v:
        t = RZ(v["rot"]) @ Vector(v["local"])
        loc = t + Vector(v["off"])
    else:
        t, loc = Vector(v["tgt"]), Vector(v["cam"])
    cam.location = loc
    cam.rotation_euler = (t - loc).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = v["lens"]
    cam.data.sensor_width = 36
    cam.data.dof.use_dof = True
    cam.data.dof.focus_distance = (t - loc).length
    cam.data.dof.aperture_fstop = v["f"]
    cam.data.clip_start = 0.01
    bpy.context.view_layer.update()


def rest(root, groups):
    root.rotation_euler = (0, 0, 0)
    for g in groups.values():
        g.location = (0, 0, 0)
        g.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()


def bake_shadow(path, size=512, extent=0.64):
    """Web contact shadow: sky occlusion caught on a floor plane, seen from straight above.
    Image up is Blender +Y (the speaker's back); the speaker sits at rest in the centre.
    Alpha carries the shadow; colour is black."""
    sc = bpy.context.scene
    for ob in bpy.data.collections["Studio"].objects:
        if ob.type == "LIGHT":
            ob.hide_render = True
    bpy.data.objects["cyc"].hide_render = True
    for ob in COL.objects:
        ob.visible_camera = False
    e = extent / 2
    me = bpy.data.meshes.new("catcher")
    me.from_pydata([(-e, -e, 0), (e, -e, 0), (e, e, 0), (-e, e, 0)], [], [(0, 1, 2, 3)])
    cat = bpy.data.objects.new("catcher", me)
    sc.collection.objects.link(cat)
    cat.is_shadow_catcher = True
    sc.world.node_tree.nodes.get("Background").inputs["Color"].default_value = (1, 1, 1, 1)
    sc.render.film_transparent = True
    cam = sc.camera
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = extent
    cam.data.dof.use_dof = False
    cam.location = (0, 0, 2.0)
    cam.rotation_euler = (0, 0, 0)
    sc.render.resolution_x = sc.render.resolution_y = size
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0.0
    sc.cycles.samples = 256
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"shadow: {path}")


def export_glb(path):
    """Geometry, hierarchy and plain PBR values only. Wood and paper textures ship as WebP and are
    attached by material name in the web scene, so finishes and tiers swap without a reload."""
    for m in bpy.data.materials:
        nt = m.node_tree
        if not nt:
            continue
        for n in list(nt.nodes):
            if n.type in ("TEX_IMAGE", "BUMP", "MAP_RANGE", "TEX_NOISE", "TEX_COORD", "MAPPING", "TANGENT"):
                nt.nodes.remove(n)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in COL.objects:
        ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True,
                              export_yup=True, export_texcoords=True, export_normals=True,
                              export_materials="EXPORT", export_cameras=False, export_lights=False,
                              export_animations=False)
    print(f"glb: {path} {os.path.getsize(path)} bytes")


def open_hatch(g, t):
    """Turn the Rear group about the hinge line: location = h - R h keeps the hinge fixed."""
    phi = math.radians(HATCH["angle"] * t)
    hx, hy = HATCH["hinge"]
    c, s_ = math.cos(phi), math.sin(phi)
    g.rotation_euler = (0, 0, phi)
    g.location = (hx - (c * hx - s_ * hy), hy - (s_ * hx + c * hy), 0)


def b3(v):
    """three.js (y up, front +z) to Blender (z up, front -y)."""
    return Vector((v[0], -v[2], v[1]))


def poster_floor(png, extent=0.64):
    """The baked contact shadow as a camera-only plane under the speaker: the web scene lays the same
    texture under the real-time model, so a poster and the live canvas carry the same shadow."""
    e = extent / 2
    me = bpy.data.meshes.new("poster_floor")
    me.from_pydata([(-e, -e, 0.0004), (e, -e, 0.0004), (e, e, 0.0004), (-e, e, 0.0004)], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(name="UVMap")
    for li, (u, v) in zip(range(4), ((0, 0), (1, 0), (1, 1), (0, 1))):
        uv.data[li].uv = (u, v)
    m = bpy.data.materials.new("poster_floor")
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(png)
    tex.image.colorspace_settings.name = "Non-Color"
    mix = nt.nodes.new("ShaderNodeMixShader")
    clear = nt.nodes.new("ShaderNodeBsdfTransparent")
    black = nt.nodes.new("ShaderNodeEmission")
    black.inputs["Color"].default_value = (0, 0, 0, 1)
    black.inputs["Strength"].default_value = 0.0
    nt.links.new(tex.outputs["Alpha"], mix.inputs["Fac"])
    nt.links.new(clear.outputs["BSDF"], mix.inputs[1])
    nt.links.new(black.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    me.materials.append(m)
    ob = bpy.data.objects.new("poster_floor", me)
    bpy.context.scene.collection.objects.link(ob)
    for attr in ("visible_shadow", "visible_diffuse", "visible_glossy", "visible_transmission", "visible_volume_scatter"):
        setattr(ob, attr, False)
    return ob


def render_posters(a, root, groups, cam):
    """Transparent square stills of named camera states, framed exactly as scene.ts frames them:
    the camera looks at the state's target, the square spans the state's fov, the target sits in the
    middle (the page and the canvas both apply the state's shift). The cyc still lights the speaker
    but is hidden from the camera; the page draws the background."""
    import json
    path = a.cameras or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "lib", "halvane", "cameras.json")
    states = json.load(open(path, encoding="utf-8"))["states"]
    sc = bpy.context.scene
    shadow_png = a.poster_shadow or os.path.join(a.out, "web", "shadow.png")
    floor = poster_floor(shadow_png)
    floor.parent = root
    bpy.data.objects["cyc"].visible_camera = False
    sc.render.film_transparent = True
    sc.render.image_settings.color_mode = "RGBA"
    os.makedirs(os.path.join(a.out, "posters"), exist_ok=True)
    for name in a.posters.split(","):
        st = states[name]
        rest(root, groups)
        root.rotation_euler = (0, 0, math.radians(st["yaw"]))
        # explode: a number moves every driver that far along its EXPLODE travel; {"Woofer": 1} moves only that one
        ex = st.get("explode", 0)
        for gname, g in groups.items():
            f = ex.get(gname, 0) if isinstance(ex, dict) else ex
            if f and gname in EXPLODE:
                g.location = tuple(v * f for v in EXPLODE[gname])
        if st.get("hatch"):
            open_hatch(groups["Rear"], st["hatch"])
        t, loc = b3(st["target"]), b3(st["pos"])
        cam.data.type = "PERSP"
        cam.location = loc
        cam.rotation_euler = (t - loc).to_track_quat("-Z", "Y").to_euler()
        # a close-up that fills the screen is rendered `cover` times wider (same centre, same pixel density)
        cover = st.get("poster", {}).get("cover", 1)
        sc.render.resolution_x = sc.render.resolution_y = round(a.poster_size * cover)
        cam.data.sensor_fit = "AUTO"
        cam.data.sensor_width = 36
        cam.data.lens = 18 / (cover * math.tan(math.radians(st["fov"]) / 2))
        cam.data.shift_x = cam.data.shift_y = 0
        cam.data.dof.use_dof = True
        cam.data.dof.focus_distance = (t - loc).length
        # the macro keeps a little falloff behind the waveguide, but its face (rim to throat) stays sharp
        cam.data.dof.aperture_fstop = 8 if name == "driver-macro" else 11
        cam.data.clip_start = 0.01
        lamp = None
        if st.get("lamp"):
            L = st["lamp"]
            ld = bpy.data.lights.new("state_lamp", "AREA")
            ld.shape = "DISK"
            ld.size = L.get("size", 0.4)
            ld.energy = L["power"]
            ld.color = kelvin(L.get("k", 4500))
            lamp = bpy.data.objects.new("state_lamp", ld)
            sc.collection.objects.link(lamp)
            lamp.location = b3(L["pos"])
            lamp.rotation_euler = (t - lamp.location).to_track_quat("-Z", "Y").to_euler()
            lamp.visible_camera = False
        bpy.context.view_layer.update()
        sc.render.filepath = os.path.join(a.out, "posters", f"{a.finish}-{name}.png")
        t1 = time.time()
        bpy.ops.render.render(write_still=True)
        print(f"poster {name}: {time.time() - t1:.1f}s")
        if lamp:
            bpy.data.objects.remove(lamp)
    bpy.data.objects.remove(floor)
    bpy.data.objects["cyc"].visible_camera = True
    sc.render.film_transparent = False


def finish_outputs(a, root, groups, cam=None):
    if a.posters and cam is not None:
        render_posters(a, root, groups, cam)
    if not (a.shadow or a.glb):
        return
    rest(root, groups)
    if a.glb:
        os.makedirs(os.path.dirname(a.glb), exist_ok=True)
        export_glb(a.glb)
    if a.shadow:
        os.makedirs(os.path.dirname(a.shadow), exist_ok=True)
        bake_shadow(a.shadow)


def main():
    global COL
    a = parse()
    t0 = time.time()
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob)
    COL = bpy.data.collections.new("LumenOne")
    bpy.context.scene.collection.children.link(COL)
    build_materials(a.tex)
    root = empty("LumenOne")
    groups = {
        "Cabinet": build_cabinet(root, MAT[f"wood_{a.finish}"]),
        "Woofer": build_woofer(root),
        "Tweeter": build_tweeter(root),
        "Rear": build_rear(root, a.font),
    }
    build_wadding(groups["Cabinet"])
    global RIM_K, RIM_W, RIM_POS
    RIM_K, RIM_W = a.rim_k, a.rim_w
    RIM_POS = tuple(float(v) for v in a.rim_pos.split(",")) if a.rim_pos else None
    cam = build_studio()
    tris = sum(len(o.data.polygons) for o in COL.objects if o.type == "MESH")
    print(f"built in {time.time() - t0:.1f}s, {tris} faces, {len(COL.objects)} objects")
    cab = bpy.data.objects["cabinet"].data
    per = {}
    for poly in cab.polygons:
        per[poly.material_index] = per.get(poly.material_index, 0) + 1
    print("cabinet faces by material:", {cab.materials[k].name: v for k, v in sorted(per.items())})
    setup_render(a)
    os.makedirs(os.path.join(a.out, "renders"), exist_ok=True)
    place(root, groups, cam, VIEWS["hero"])
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(a.out, "lumen-one.blend"))
    if a.no_render:
        finish_outputs(a, root, groups, cam)
        return
    tag = a.tag or ("-preview" if a.preview else "")
    for name in a.views.split(","):
        place(root, groups, cam, VIEWS[name])
        bpy.context.scene.render.filepath = os.path.join(a.out, "renders", f"{a.finish}-{name}{tag}.png")
        t1 = time.time()
        bpy.ops.render.render(write_still=True)
        print(f"render {name}: {time.time() - t1:.1f}s")
    finish_outputs(a, root, groups, cam)


main()
