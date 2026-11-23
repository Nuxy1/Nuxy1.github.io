"""Experience still: the Lumen One pair in a quiet room, rendered from the canonical model.

Usage (from portfolio/site):
  blender -b <M>/lumen-one.blend --factory-startup -P scripts/halvane/build_room.py -- --tex <M>/tex --out <M>
          [--res 2400x1350] [--samples 192] [--preview] [--tag -a]

<M>/lumen-one.blend is written by build_speaker.py (every run). This script does not model the speaker: it
instances the saved "LumenOne" collection twice, so the room still shows exactly the product the page shows.
The studio (cyc, lights, camera) is excluded; the room brings its own light: late-afternoon sun through an
off-frame window (a shadow-only blocker shapes the patch on the plaster) and a dim warm bounce.
Everything is fictional and generic: plain books, an unglazed vessel, no logos, no third-party products.
"""
import argparse
import math
import os
import sys

from typing import Any

import bmesh
import bpy
from mathutils import Vector


def srgb_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexlin(h):
    h = h.lstrip("#")
    return tuple(srgb_lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


def kelvin(k):
    t = k / 100.0
    r = 255.0 if t <= 66 else 329.698727446 * (t - 60) ** -0.1332047592
    g = (99.4708025861 * math.log(t) - 161.1195681661) if t <= 66 else 288.1221695283 * (t - 60) ** -0.0755148492
    b = 255.0 if t >= 66 else (0.0 if t <= 19 else 138.5177312231 * math.log(t - 10) - 305.0447927307)
    return tuple(srgb_lin(min(max(c, 0.0), 255.0) / 255.0) for c in (r, g, b))


ROOM: Any = None  # the Room collection, made in main()


def box(name, center, size, mat, bevel=0.003):
    """An axis-aligned box with a real bevel (modifier, so Cycles renders the rounded edge)."""
    me = bpy.data.meshes.new(name)
    sx, sy, sz = (s / 2 for s in size)
    v = [(x * sx, y * sy, z * sz) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
    f = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    me.from_pydata(v, [], f)
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    ROOM.objects.link(ob)
    ob.location = center
    if bevel:
        m = ob.modifiers.new("bevel", "BEVEL")
        m.width = bevel
        m.segments = 3
        m.limit_method = "ANGLE"
    return ob


def principled(name, color, rough, **kw):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hexlin(color)
    b.inputs["Roughness"].default_value = rough
    for k, v in kw.items():
        b.inputs[k].default_value = v
    return m, m.node_tree, b


def wood(name, tex, finish, tint, rough, repeat=0.55, bump=0.25):
    """Box-projected wood from the same procedural textures as the speaker, grain along x."""
    m, nt, b = principled(name, "#ffffff", rough)
    N, L = nt.nodes, nt.links
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / repeat, 1 / repeat, 1 / repeat)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    col = N.new("ShaderNodeTexImage")
    col.image = bpy.data.images.load(os.path.join(tex, f"{finish}-color.png"), check_existing=True)
    hgt = N.new("ShaderNodeTexImage")
    hgt.image = bpy.data.images.load(os.path.join(tex, f"{finish}-height.png"), check_existing=True)
    hgt.image.colorspace_settings.name = "Non-Color"
    for t in (col, hgt):
        t.projection = "BOX"
        t.projection_blend = 0.15
        L.new(mp.outputs["Vector"], t.inputs["Vector"])
    mul = N.new("ShaderNodeMix")
    mul.data_type = "RGBA"
    mul.blend_type = "MULTIPLY"
    mul.inputs["Factor"].default_value = 1.0
    L.new(col.outputs["Color"], mul.inputs["A"])
    mul.inputs["B"].default_value = hexlin(tint)
    L.new(mul.outputs["Result"], b.inputs["Base Color"])
    bp = N.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = bump
    bp.inputs["Distance"].default_value = 0.0004
    L.new(hgt.outputs["Color"], bp.inputs["Height"])
    L.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m


def plaster(name, color):
    m, nt, b = principled(name, color, 0.92)
    N, L = nt.nodes, nt.links
    nz = N.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 18.0
    nz.inputs["Detail"].default_value = 8.0
    nz.inputs["Roughness"].default_value = 0.62
    bp = N.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = 0.22
    bp.inputs["Distance"].default_value = 0.002
    L.new(nz.outputs["Fac"], bp.inputs["Height"])
    L.new(bp.outputs["Normal"], b.inputs["Normal"])
    # faint trowel mottling in the colour, so the wall is not a flat card
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = tuple(c * 0.9 for c in hexlin(color)[:3]) + (1.0,)
    ramp.color_ramp.elements[1].color = hexlin(color)
    nz2 = N.new("ShaderNodeTexNoise")
    nz2.inputs["Scale"].default_value = 2.2
    nz2.inputs["Detail"].default_value = 3.0
    L.new(nz2.outputs["Fac"], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], b.inputs["Base Color"])
    return m


def vase(name, loc, mat):
    """A thrown stoneware bottle vase (lathe profile, open mouth with an inner wall), so it cannot be
    mistaken for a device."""
    prof = [(0.0, 0.0), (0.042, 0.0), (0.056, 0.012), (0.066, 0.05), (0.068, 0.085), (0.06, 0.125),
            (0.042, 0.158), (0.024, 0.18), (0.019, 0.205), (0.021, 0.226), (0.026, 0.232), (0.022, 0.236),
            (0.016, 0.228), (0.014, 0.2)]
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0.0, z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * math.pi, steps=64, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for f in me.polygons:
        f.use_smooth = True
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    ROOM.objects.link(ob)
    ob.location = loc
    ob.modifiers.new("sub", "SUBSURF").levels = 1
    return ob


def speaker_instance(name, loc, rot_deg, src):
    ob = bpy.data.objects.new(name, None)
    ob.instance_type = "COLLECTION"
    ob.instance_collection = src
    ob.location = loc
    ob.rotation_euler = (0, 0, math.radians(rot_deg))
    ROOM.objects.link(ob)
    return ob


def window_blocker(x, y0, y1, z0, z1, mullions=(1, 2)):
    """A shadow-only wall with a window opening, so the sun lands on the plaster as a shaped patch.
    The wall stands in the yz plane at x; the opening runs y0..y1, z0..z1, split by mullions."""
    t = 0.05
    big = 6.0
    mat, _, _ = principled("blocker", "#000000", 1.0)
    parts = [box("blk_lo", (x, 0, (z0 - big) / 2), (t, 2 * big, z0 + big), mat, 0),
             box("blk_hi", (x, 0, (z1 + big) / 2), (t, 2 * big, big - z1), mat, 0),
             box("blk_l", (x, (y0 - big) / 2, (z0 + z1) / 2), (t, big + y0, z1 - z0), mat, 0),
             box("blk_r", (x, (y1 + big) / 2, (z0 + z1) / 2), (t, big - y1, z1 - z0), mat, 0)]
    nv, nh = mullions
    for k in range(1, nv + 1):
        y = y0 + (y1 - y0) * k / (nv + 1)
        parts.append(box(f"mul_v{k}", (x, y, (z0 + z1) / 2), (t, 0.045, z1 - z0), mat, 0))
    for k in range(1, nh + 1):
        z = z0 + (z1 - z0) * k / (nh + 1)
        parts.append(box(f"mul_h{k}", (x, (y0 + y1) / 2, z), (t, y1 - y0, 0.045), mat, 0))
    for ob in parts:
        ob.visible_camera = False
        ob.visible_glossy = False
        ob.visible_diffuse = False
    return parts


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--tex", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--res", default="2400x1350")
    p.add_argument("--samples", type=int, default=192)
    p.add_argument("--preview", action="store_true")
    p.add_argument("--tag", default="")
    p.add_argument("--sun", type=float, default=5.0, help="sun strength (W/m2)")
    p.add_argument("--sun-k", type=int, default=4300)
    p.add_argument("--bounce-k", type=int, default=6500, help="skylight bounce colour temperature")
    p.add_argument("--bounce-w", type=float, default=80.0)
    p.add_argument("--focus", type=float, default=-0.66, help="x of the speaker the lens focuses on (-0.66 left, 0.66 right)")
    p.add_argument("--sun-dir", default="0.78,0.5,-0.38", help="direction the sunlight travels (Blender axes)")
    p.add_argument("--window", default="-1.4,0.2,0.9,2.5", help="opening in the blocker: y0,y1,z0,z1")
    p.add_argument("--cam", default="-0.35,-3.3,1.0", help="camera position (Blender axes, m)")
    p.add_argument("--target", default="0.22,0.25,0.72")
    p.add_argument("--lens", type=float, default=42.0)
    a = p.parse_args(argv)

    sc = bpy.context.scene
    vl = bpy.context.view_layer
    # the studio and the source speaker are not rendered directly
    for c in vl.layer_collection.children:
        if c.name in ("Studio", "LumenOne", "Cutters"):
            c.exclude = True
    src = bpy.data.collections["LumenOne"]
    root = bpy.data.objects["LumenOne"]
    root.rotation_euler = (0, 0, 0)
    root.location = (0, 0, 0)
    for g in ("Cabinet", "Rear", "Tweeter", "Woofer"):
        bpy.data.objects[g].location = (0, 0, 0)
        bpy.data.objects[g].rotation_euler = (0, 0, 0)
    # the saved file carries whichever finish ran last; the room shows walnut
    cab = bpy.data.objects["cabinet"]
    for i, m in enumerate(cab.data.materials):
        if m and m.name.startswith("wood_"):
            cab.data.materials[i] = bpy.data.materials["wood_walnut"]
    print("cabinet materials:", [m.name for m in cab.data.materials if m])

    global ROOM
    ROOM = bpy.data.collections.new("Room")
    sc.collection.children.link(ROOM)

    # ---------------------------------------------------------------- materials
    floor_m = wood("floor_oak", a.tex, "chalk", "#5e5246", 0.55, repeat=0.9, bump=0.18)
    board_m = wood("sideboard_ash", a.tex, "graphite", "#d9d2c8", 0.5, repeat=0.55, bump=0.12)
    wall_m = plaster("plaster", "#8c867d")
    shadow_m, _, _ = principled("gap", "#0b0907", 0.9)
    cloth = [principled(f"cloth{k}", c, r)[0] for k, (c, r) in
             enumerate((("#b9b09f", 0.9), ("#5e2a22", 0.8), ("#383a32", 0.85)))]
    stone, _, _ = principled("stoneware", "#cdc3b1", 0.72)

    # ---------------------------------------------------------------- room
    WALL_Y = 0.52
    box("floor", (0, -1.0, -0.01), (9.0, 7.0, 0.02), floor_m, 0)
    box("wall", (0, WALL_Y + 0.05, 1.5), (9.0, 0.1, 3.0), wall_m, 0)
    box("skirting", (0, WALL_Y - 0.006, 0.04), (9.0, 0.012, 0.08), wall_m, 0.002)

    # sideboard: plinth recessed under a long low carcass, three doors with shadow gaps, a solid top
    L, Dp, Hc, PL = 1.9, 0.44, 0.47, 0.06
    cy = WALL_Y - 0.03 - Dp / 2
    box("plinth", (0, cy + 0.02, PL / 2), (L - 0.12, Dp - 0.08, PL), shadow_m, 0.002)
    box("carcass", (0, cy + 0.004, PL + Hc / 2), (L, Dp - 0.008, Hc), board_m, 0.002)
    gap, nd = 0.004, 3
    dw = (L - 0.02 - gap * (nd - 1)) / nd
    for k in range(nd):
        x = -L / 2 + 0.01 + dw / 2 + k * (dw + gap)
        box(f"door{k}", (x, cy - Dp / 2 + 0.002, PL + Hc / 2), (dw, 0.012, Hc - 0.03), board_m, 0.0015)
    TOP = PL + Hc + 0.028
    box("top", (0, cy, PL + Hc + 0.014), (L + 0.02, Dp + 0.01, 0.028), board_m, 0.004)

    # the pair, toed in towards the listening seat
    SX = 0.66
    speaker_instance("lumen_left", (-SX, cy - 0.02, TOP), 9.0, src)
    speaker_instance("lumen_right", (SX, cy - 0.02, TOP), -9.0, src)

    # quiet objects between them: three plain cloth-bound books and an unglazed vessel
    z = TOP
    for k, (w, d, h, r) in enumerate(((0.25, 0.18, 0.032, 4), (0.23, 0.165, 0.026, -3), (0.21, 0.15, 0.022, 7))):
        ob = box(f"book{k}", (-0.2, cy + 0.02, z + h / 2), (w, d, h), cloth[k], 0.002)
        ob.rotation_euler = (0, 0, math.radians(r))
        z += h
    vase("vase", (0.2, cy + 0.06, TOP), stone)

    # ---------------------------------------------------------------- light
    w = bpy.data.worlds.new("room")
    sc.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    w.node_tree.nodes["Background"].inputs["Color"].default_value = kelvin(4800) + (1.0,)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.006

    sun_d = bpy.data.lights.new("sun", "SUN")
    sun_d.energy = a.sun
    sun_d.angle = math.radians(1.2)
    sun_d.color = kelvin(a.sun_k)
    sun = bpy.data.objects.new("sun", sun_d)
    ROOM.objects.link(sun)
    # low afternoon sun from the left, slightly in front of the wall, raking across the plaster
    sun_dir = Vector(tuple(float(v) for v in a.sun_dir.split(","))).normalized()
    sun.rotation_euler = sun_dir.to_track_quat("-Z", "Y").to_euler()
    window_blocker(-2.6, *(float(v) for v in a.window.split(",")), mullions=(1, 1))

    bounce_d = bpy.data.lights.new("bounce", "AREA")
    bounce_d.shape = "RECTANGLE"
    bounce_d.size, bounce_d.size_y = 3.0, 1.5
    bounce_d.energy = a.bounce_w
    bounce_d.color = kelvin(a.bounce_k)
    bounce = bpy.data.objects.new("bounce", bounce_d)
    ROOM.objects.link(bounce)
    bounce.location = (0.4, -2.6, 2.2)
    bounce.rotation_euler = (Vector((0, 0.2, 0.7)) - bounce.location).to_track_quat("-Z", "Y").to_euler()
    bounce.visible_camera = False
    bounce.visible_glossy = False

    # ---------------------------------------------------------------- camera + render
    cam_d = bpy.data.cameras.new("room_cam")
    cam_d.lens = a.lens
    cam_d.sensor_width = 36
    cam_d.dof.use_dof = True
    cam_d.dof.aperture_fstop = 5.6
    cam = bpy.data.objects.new("room_cam", cam_d)
    ROOM.objects.link(cam)
    cam.location = tuple(float(v) for v in a.cam.split(","))
    tgt = Vector(tuple(float(v) for v in a.target.split(",")))
    cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam_d.dof.focus_distance = (Vector((a.focus, cy, TOP + 0.17)) - cam.location).length
    sc.camera = cam

    sc.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    try:
        prefs.compute_device_type = "HIP"
        prefs.get_devices()
        used = [d.name for d in prefs.devices if d.type == "HIP" and "Radeon(TM) Graphics" not in d.name]
        for d in prefs.devices:
            d.use = d.name in used
        sc.cycles.device = "GPU" if used else "CPU"
    except Exception as e:
        print("GPU setup failed, CPU:", e)
        sc.cycles.device = "CPU"
    rw, rh = tuple(int(v) for v in a.res.split("x"))
    if a.preview:
        rw, rh = int(rw / 2.5), int(rh / 2.5)
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = rw, rh, 100
    sc.render.film_transparent = False
    sc.cycles.samples = 48 if a.preview else a.samples
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.use_denoising = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.image_settings.color_depth = "8"
    sc.view_settings.view_transform = "AgX"
    for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
        try:
            sc.view_settings.look = look
            break
        except Exception:
            pass
    sc.view_settings.exposure = -0.3
    os.makedirs(os.path.join(a.out, "renders"), exist_ok=True)
    out = os.path.join(a.out, "renders", f"room{a.tag or ('-preview' if a.preview else '')}.png")
    sc.render.filepath = out
    import time
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"room: {out} {time.time() - t0:.1f}s")


main()
