extends Node2D
## Partículas e efeitos de combate — porte fiel de js/render/gfx.js (G.emit/G.burst/G.drawParticles)
## e js/render/fx.js (cortes curvos, clarões, impactos por material, parry, guarda, dissolver).
## Dois nós: normal e aditivo ('lighter' no jogo web).

const ART := {"fire": {"n": 9, "w": 53, "h": 81, "anchor": "bottom", "y": 0}, "parry": {"n": 5, "w": 86, "h": 70, "anchor": "center", "y": 81},
	"heal": {"n": 6, "w": 93, "h": 89, "anchor": "bottom", "y": 151}, "boom": {"n": 7, "w": 101, "h": 82, "anchor": "bottom", "y": 240}}
const MAT := {
	"flesh": {"tint": Color8(255, 168, 104), "drops": ["#2c1a1e", "#3e2026", "#1e1216"], "flakes": ["#5a5058", "#3a3238"], "embers": 3, "sparks": 0},
	"ash": {"tint": Color8(255, 176, 96), "drops": ["#3a3234", "#56484a", "#2a2426"], "flakes": ["#7a6e70", "#4a4044"], "embers": 6, "sparks": 0},
	"armor": {"tint": Color8(255, 222, 150), "drops": [], "flakes": ["#6a6670"], "embers": 0, "sparks": 12},
	"stone": {"tint": Color8(236, 220, 196), "drops": [], "flakes": ["#8a7e70", "#6a6058", "#a89a88"], "embers": 0, "sparks": 4, "dust": "#8a7e70"},
	"spirit": {"tint": Color8(196, 168, 255), "drops": [], "flakes": [], "embers": 0, "sparks": 0, "wisps": 8},
	"wax": {"tint": Color8(255, 214, 140), "drops": ["#e8dcb8", "#cfc09a", "#f4ecd0"], "flakes": [], "embers": 4, "sparks": 0},
	"wood": {"tint": Color8(240, 200, 150), "drops": [], "flakes": ["#6a4a30", "#4a3420", "#8a6440"], "embers": 0, "sparks": 0, "dust": "#5a4a3a"},
	"molten": {"tint": Color8(255, 150, 60), "drops": ["#ff9030", "#ffd060", "#c04010"], "flakes": [], "embers": 10, "sparks": 6},
	"metal": {"tint": Color8(255, 222, 150), "drops": [], "flakes": ["#6a6670"], "embers": 0, "sparks": 12},
}
const BLADE := {"core": Color8(255, 250, 236), "edge": Color8(255, 196, 140), "len": 30.0, "wid": 4.2}

var parts: Array = []
var list: Array = []       # efeitos (cortes, clarões, anéis, arte)
var glow: Node2D
var art_tex: Texture2D
var radial: Texture2D
var world

func _ready() -> void:
	glow = Node2D.new()
	var m := CanvasItemMaterial.new()
	m.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	glow.material = m
	glow.z_index = 20
	glow.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	glow.draw.connect(_draw_glow)
	add_child(glow)
	z_index = 15
	art_tex = load("res://art/sprites/fx_art.png")
	var g := Gradient.new()
	g.offsets = PackedFloat32Array([0.0, 1.0]); g.colors = PackedColorArray([Color(1, 1, 1, 1), Color(1, 1, 1, 0)])
	var gt := GradientTexture2D.new()
	gt.gradient = g; gt.fill = GradientTexture2D.FILL_RADIAL; gt.width = 64; gt.height = 64
	gt.fill_from = Vector2(0.5, 0.5); gt.fill_to = Vector2(1, 0.5)
	radial = gt

static func _c(v) -> Color:
	return v if v is Color else Color(v)

# ------------------------------------------------------------------ G.emit / G.burst
func emit(o: Dictionary) -> void:
	if parts.size() > 900:
		return
	var q := {"x": 0.0, "y": 0.0, "vx": 0.0, "vy": 0.0, "g": 0.0, "drag": 0.0, "life": 1.0, "size": 2.0, "color": Color.WHITE,
		"add": false, "rot": 0.0, "vr": 0.0, "kind": "dot", "fade": true, "shrink": false, "alpha": 1.0, "grow": 0.0, "wobble": 0.0, "collide": false}
	q.merge(o, true)
	q["color"] = _c(q["color"])
	q["max"] = q["life"]
	parts.append(q)

func burst_o(x: float, y: float, n: int, o: Dictionary) -> void:
	for i in n:
		var a: float = o.get("angle", 0.0) + (randf() - 0.5) * o.get("spread", TAU)
		var sp := randf_range(o.get("speedMin", 20.0), o.get("speed", 120.0))
		var q := o.duplicate()
		var jx: float = o.get("jx", 0.0); var jy: float = o.get("jy", 0.0)
		q["x"] = x + randf_range(-jx, jx); q["y"] = y + randf_range(-jy, jy)
		q["vx"] = cos(a) * sp; q["vy"] = sin(a) * sp
		var lf: float = o.get("life", 0.6); var sz: float = o.get("size", 2.0)
		q["life"] = randf_range(lf * 0.6, lf); q["size"] = randf_range(sz * 0.6, sz)
		emit(q)

# ------------------------------------------------------------------ fx.js
func _add(o: Dictionary) -> void:
	if list.size() < 120:
		o["t"] = 0.0
		list.append(o)

func cut(x: float, y: float, ang: float, o := {}) -> void:
	_add({"type": "cut", "x": x, "y": y, "ang": ang, "life": o.get("life", 0.16), "len": o.get("len", 30.0), "wid": o.get("wid", 4.0),
		"bend": o.get("bend", 5.0), "core": o.get("core", Color8(255, 250, 236)), "edge": o.get("edge", Color8(255, 196, 140))})

func flare(x: float, y: float, r: float, col := Color8(255, 220, 170), life := 0.12) -> void:
	_add({"type": "flare", "x": x, "y": y, "r": r, "col": col, "life": life})

func ring(x: float, y: float, rx: float, ry: float, col := Color8(255, 230, 190), life := 0.3, width := 2.0) -> void:
	_add({"type": "ring", "x": x, "y": y, "rx": rx, "ry": ry, "col": col, "life": life, "width": width})

func sparks_fx(x: float, y: float, n: int, dir: float, o := {}) -> void:
	for i in n:
		var a: float = (0.0 if dir > 0 else PI) + randf_range(-1, 1) * o.get("spread", 1.1) - o.get("up", 0.5)
		var sp := randf_range(120, o.get("speed", 320.0))
		emit({"x": x, "y": y, "vx": cos(a) * sp, "vy": sin(a) * sp, "g": 620.0, "drag": 1.5, "life": randf_range(0.18, 0.42), "size": randf_range(1.6, 2.6),
			"color": o.get("cols", ["#fff4d0", "#ffd27a", "#ffae48"]).pick_random(), "add": true, "kind": "line"})

func dust_fx(x: float, y: float, n: int, col = "#8a7e70", o := {}) -> void:
	for i in n:
		var jx: float = o.get("jx", 6.0)
		emit({"x": x + randf_range(-jx, jx), "y": y + randf_range(-3, 2), "vx": randf_range(-1, 1) * o.get("speed", 50.0), "vy": randf_range(-30, -6), "drag": 3.0,
			"life": randf_range(0.4, 0.8), "size": randf_range(2.5, 4.5), "grow": o.get("grow", 2.4), "color": col, "alpha": o.get("alpha", 0.5), "kind": "puff"})

func art(nm: String, x: float, y: float, o := {}) -> void:
	var m: Dictionary = ART.get(nm, {})
	if m.is_empty():
		return
	var fo = o.get("follow")
	_add({"type": "art", "name": nm, "m": m, "x": x, "y": y, "h": o.get("h", 40.0), "life": o.get("life", 0.4), "add": o.get("add", true), "follow": fo,
		"oy": (y - fo.pos.y) if fo else 0.0, "ox": (x - fo.cx) if fo else 0.0, "dir": o.get("dir", 1), "loop": o.get("loop", 0.0), "alpha": o.get("alpha", 1.0)})

## impacto de um golpe: o = {x, y, mat, ang, dir, power, heavy}
func hit_fx(o: Dictionary) -> void:
	var m: Dictionary = MAT.get(o.get("mat", "flesh"), MAT["flesh"])
	var p: float = o.get("power", 1.0); var dir: float = o.get("dir", 1.0)
	var x: float = o["x"]; var y: float = o["y"]
	var ang: float = o.get("ang", 0.0 if dir > 0 else PI)
	var heavy: bool = o.get("heavy", false)
	var sc := (1.3 if heavy else 1.0) * (0.85 + 0.15 * p)
	cut(x, y, ang, {"len": BLADE["len"] * sc, "wid": BLADE["wid"] * sc, "core": BLADE["core"], "edge": BLADE["edge"], "bend": o.get("bend", 1.0) * 6.0 * sc, "life": 0.2 if heavy else 0.15})
	flare(x, y, 9 + 5 * p, BLADE["edge"], 0.09)
	var vx := cos(ang); var vy := sin(ang)
	if not m["drops"].is_empty():
		for i in roundi((12 if heavy else 7) * p):
			var sp := randf_range(60, 220); var a := atan2(vy, vx) + randf_range(-0.7, 0.7)
			emit({"x": x + randf_range(-3, 3), "y": y + randf_range(-3, 3), "vx": cos(a) * sp, "vy": sin(a) * sp - 60, "g": 520.0, "life": randf_range(0.35, 0.7), "size": randf_range(0.9, 2), "color": m["drops"].pick_random(), "collide": true})
	if not m["flakes"].is_empty():
		for i in roundi(4 * p):
			emit({"x": x, "y": y, "vx": vx * randf_range(20, 90) + randf_range(-40, 40), "vy": randf_range(-90, -20), "g": 160.0, "drag": 1.0, "life": randf_range(0.6, 1.1), "size": randf_range(1, 2), "color": m["flakes"].pick_random(), "kind": "flake", "vr": randf_range(-6, 6)})
	for i in roundi(m["embers"] * p):
		emit({"x": x + randf_range(-4, 4), "y": y + randf_range(-4, 4), "vx": vx * randf_range(10, 60) + randf_range(-30, 30), "vy": randf_range(-80, -20), "drag": 1.2, "life": randf_range(0.4, 0.9), "size": randf_range(0.8, 1.5), "color": ["#ffb040", "#ff7a20", "#ffe0a0"].pick_random(), "add": true, "shrink": true})
	if m["sparks"] > 0:
		sparks_fx(x, y, roundi(m["sparks"] * p), signf(vx) if vx != 0 else dir, {"speed": 300 + 60 * p})
	if m.has("dust"):
		dust_fx(x, y, roundi(3 * p), m["dust"])
	if m.has("wisps"):
		for i in roundi(m["wisps"] * p):
			emit({"x": x + randf_range(-6, 6), "y": y + randf_range(-8, 8), "vx": vx * randf_range(10, 50) + randf_range(-25, 25), "vy": randf_range(-50, -10), "wobble": randf_range(3, 6), "drag": 1.4, "life": randf_range(0.5, 1), "size": randf_range(1.2, 2.4), "color": ["#c8b0ff", "#e8dcff", "#9a7ae0"].pick_random(), "add": true, "kind": "glow"})

func block(x: float, y: float, dir: float, big := false) -> void:
	art("parry", x, y, {"h": 30.0 if big else 22.0, "life": 0.22, "dir": -dir})
	flare(x, y, 16.0 if big else 11.0, Color8(255, 226, 170), 0.1)
	sparks_fx(x, y, 10 if big else 6, -dir, {"speed": 260.0, "up": 0.7})
	cut(x, y, -PI / 2, {"len": 20.0 if big else 14.0, "wid": 2.4, "bend": dir * 6, "core": Color8(255, 248, 230), "edge": Color8(255, 200, 120), "life": 0.12})

func parry(x: float, y: float, dir: float) -> void:
	art("parry", x, y, {"h": 50.0, "life": 0.32, "dir": dir})
	flare(x, y, 34, Color8(255, 236, 190), 0.24)
	cut(x, y, -PI / 2 + dir * 0.25, {"len": 34.0, "wid": 5.0, "bend": dir * 12, "core": Color8(255, 255, 245), "edge": Color8(255, 210, 120), "life": 0.22})
	for i in 9:
		var a := (0.0 if dir > 0 else PI) + randf_range(-1.4, 1.4); var sp := randf_range(260, 520)
		emit({"x": x, "y": y, "vx": cos(a) * sp, "vy": sin(a) * sp, "drag": 9.0, "life": randf_range(0.12, 0.22), "size": randf_range(2.4, 3.6), "color": "#fffaf0", "add": true, "kind": "line"})
	sparks_fx(x, y, 18, -dir, {"speed": 380.0, "spread": 1.6, "up": 0.6})
	sparks_fx(x, y, 8, dir, {"speed": 200.0, "spread": 1.2, "up": 0.9, "cols": ["#ffffff", "#fff0c0"]})

func hurt(x: float, y: float, dir: float) -> void:
	for i in 12:
		var a := (0.0 if dir > 0 else PI) + randf_range(-0.9, 0.9) - 0.4; var sp := randf_range(60, 200)
		emit({"x": x, "y": y, "vx": cos(a) * sp, "vy": sin(a) * sp, "g": 520.0, "life": randf_range(0.4, 0.8), "size": randf_range(1, 2.2), "color": ["#5a1018", "#3a0a10", "#7a1820"].pick_random(), "collide": true})
	for i in 5:
		emit({"x": x, "y": y, "vx": randf_range(-60, 60), "vy": randf_range(-110, -30), "drag": 1.0, "life": 0.7, "size": 1.2, "color": ["#ffb040", "#ff7020"].pick_random(), "add": true, "shrink": true})
	flare(x, y, 14, Color8(255, 120, 90), 0.1)

func impact(x: float, y: float, mat: String, dir: float, power := 1.0) -> void:
	var m: Dictionary = MAT.get(mat, MAT["stone"]); var p := power
	flare(x, y, 8 + 6 * p, m["tint"], 0.1)
	if m["sparks"] > 0:
		sparks_fx(x, y, roundi(m["sparks"] * p), -dir, {"speed": 260.0, "up": 0.6})
	if m.has("dust"):
		dust_fx(x, y, roundi(3 * p), m["dust"])
	if p > 1:
		for s in [-1, 1]:
			for i in 3:
				emit({"x": x + s * randf_range(2, 8), "y": y - 2, "vx": s * randf_range(60, 150), "vy": randf_range(-24, -4), "drag": 3.2, "life": randf_range(0.45, 0.8), "size": randf_range(3, 5), "grow": 2.2, "color": m.get("dust", "#8a7e70"), "alpha": 0.45, "kind": "puff"})
	var fl: Array = m["flakes"] if not m["flakes"].is_empty() else ["#8a7e70"]
	for i in roundi(3 * p):
		emit({"x": x, "y": y, "vx": randf_range(-60, 60), "vy": randf_range(-140, -40), "g": 600.0, "life": randf_range(0.4, 0.7), "size": randf_range(1, 1.8), "color": fl.pick_random(), "kind": "shard", "vr": randf_range(-10, 10), "collide": true})

func stun_at(x: float, y: float) -> void:
	flare(x, y, 16, Color8(255, 236, 190), 0.18)
	for i in 10:
		var a := randf() * TAU
		emit({"x": x + cos(a) * 6, "y": y + sin(a) * 3, "vx": cos(a) * 40, "vy": -randf_range(30, 70), "drag": 2.5, "life": randf_range(0.5, 0.9), "size": randf_range(0.8, 1.4), "color": ["#fff4d0", "#ffd890"].pick_random(), "add": true, "shrink": true})

## um morto de cinza desfaz-se (chamado a cada passo enquanto o corpo se desfaz)
func dissolve(e, ember = "#ff9040") -> void:
	if randf() < 0.8:
		emit({"x": e.cx + randf_range(-e.size.x / 2, e.size.x / 2), "y": e.pos.y + randf_range(e.size.y * 0.2, e.size.y), "vx": randf_range(-12, 12), "vy": randf_range(-40, -12), "drag": 1.0, "life": randf_range(0.7, 1.2), "size": randf_range(1.2, 2.4), "grow": 1.4, "color": ["#5a5458", "#6c6468", "#4a4446"].pick_random(), "alpha": 0.3, "kind": "puff"})
	if randf() < 0.5:
		emit({"x": e.cx + randf_range(-e.size.x / 2, e.size.x / 2), "y": e.pos.y + randf_range(0, e.size.y), "vx": randf_range(-15, 15), "vy": randf_range(-55, -20), "drag": 0.8, "life": randf_range(0.6, 1.1), "size": randf_range(0.6, 1.1), "color": [ember, "#ffd080"].pick_random(), "add": true, "shrink": true})

# ------------------------------------------------------------------ atalhos antigos (mesmos efeitos do jogo web)
func burst(p: Vector2, n: int, c: Color, speed := 100.0, add := false) -> void:
	burst_o(p.x, p.y, n, {"color": c, "speed": speed, "life": 0.6, "size": 1.6, "add": add})

func dust(p: Vector2, n: int) -> void:
	dust_fx(p.x, p.y, n, "#6a5e58")

func ember(p: Vector2) -> void:
	emit({"x": p.x, "y": p.y, "vx": randf_range(-15, 15), "vy": randf_range(-70, -35), "drag": 1.0, "life": randf_range(0.25, 0.5), "size": randf_range(1, 2), "color": ["#ff9030", "#ffcf60", "#ff5a10"].pick_random(), "add": true, "shrink": true})

func ash_orbs(p: Vector2, n: int) -> void:
	for i in n:
		emit({"x": p.x, "y": p.y, "vx": randf_range(-60, 60), "vy": randf_range(-160, -60), "g": 260.0, "life": randf_range(0.8, 1.3), "size": 1.6, "color": "#ffc070", "add": true, "kind": "glow"})

# ------------------------------------------------------------------ ciclo
func step(dt: float) -> void:
	for q in parts:
		q["life"] -= dt
		q["vy"] += q["g"] * dt
		if q["drag"] > 0:
			var k := exp(-q["drag"] * dt); q["vx"] *= k; q["vy"] *= k
		if q["wobble"] > 0:
			q["vx"] += sin(Time.get_ticks_msec() / 1000.0 * q["wobble"] + q["y"] * 0.05) * 30.0 * dt
		q["x"] += q["vx"] * dt; q["y"] += q["vy"] * dt; q["rot"] += q["vr"] * dt
		if q["collide"] and world and world.room and world.room.solid_at(Vector2(q["x"], q["y"])):
			q["vy"] *= -0.3; q["vx"] *= 0.6; q["y"] -= 2
			if absf(q["vy"]) < 10: q["life"] = minf(q["life"], 0.3)
	parts = parts.filter(func(q): return q["life"] > 0)
	for e in list:
		e["t"] += dt
	list = list.filter(func(e): return e["t"] < e["life"])
	queue_redraw(); glow.queue_redraw()

func _draw() -> void:
	for q in parts:
		if not q["add"]:
			_draw_part(self, q)

func _draw_glow() -> void:
	for q in parts:
		if q["add"]:
			_draw_part(glow, q)
	for e in list:
		_draw_fx(e)

func _draw_part(ci: CanvasItem, q: Dictionary) -> void:
	var t: float = q["life"] / q["max"]
	var a: float = (minf(1.0, t * 2.0) * q["alpha"]) if q["fade"] else q["alpha"]
	var sz: float = q["size"] * t if q["shrink"] else q["size"]
	var c: Color = q["color"]; c.a *= a
	var p := Vector2(q["x"], q["y"])
	match q["kind"]:
		"dot":
			ci.draw_circle(p, maxf(0.3, sz), c)
		"glow":
			ci.draw_texture_rect(radial, Rect2(p - Vector2(sz, sz) * 3.0, Vector2(sz, sz) * 6.0), false, c)
		"line":
			ci.draw_line(p, p - Vector2(q["vx"], q["vy"]) * 0.04, c, maxf(0.4, sz * 0.5), true)
		"flake":
			ci.draw_set_transform(p, q["rot"], Vector2.ONE)
			ci.draw_rect(Rect2(-sz, -sz * 0.4, sz * 2, sz * 0.8), c)
			ci.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
		"puff":
			var r: float = q["size"] * (1.0 + (1.0 - t) * (q["grow"] if q["grow"] > 0 else 2.0))
			c.a *= t
			ci.draw_circle(p, r, c)
		"shard":
			ci.draw_set_transform(p, q["rot"], Vector2.ONE)
			ci.draw_colored_polygon(PackedVector2Array([Vector2(0, -sz * 1.5), Vector2(sz * 0.7, sz), Vector2(-sz * 0.7, sz * 0.6)]), c)
			ci.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
		_:
			ci.draw_circle(p, sz, c)

func _qcurve(p0: Vector2, c0: Vector2, p1: Vector2, out: PackedVector2Array, n := 8) -> void:
	for i in n:
		var u := float(i) / n
		out.append(p0.lerp(c0, u).lerp(c0.lerp(p1, u), u))

func _draw_fx(e: Dictionary) -> void:
	var k: float = e["t"] / e["life"]
	match e["type"]:
		"cut":
			# entra depressa (0..30%), depois afina e desvanece
			var grow := minf(1.0, k / 0.3); var fade := 1.0 if k < 0.3 else 1.0 - (k - 0.3) / 0.7
			var ln: float = e["len"] * (0.55 + 0.45 * grow); var wd: float = e["wid"] * (0.4 + 0.6 * fade); var b: float = e["bend"]
			glow.draw_set_transform(Vector2(e["x"], e["y"]), e["ang"], Vector2.ONE)
			for pass_i in 2:
				var L := ln * 1.12 if pass_i == 0 else ln
				var Wd := wd * 2.1 if pass_i == 0 else wd
				var pts := PackedVector2Array()
				_qcurve(Vector2(-L / 2, 0), Vector2(0, -b - Wd), Vector2(L / 2, 0), pts)
				_qcurve(Vector2(L / 2, 0), Vector2(0, -b + Wd * 0.35), Vector2(-L / 2, 0), pts)
				var col: Color = e["edge"] if pass_i == 0 else e["core"]
				col.a = (0.45 if pass_i == 0 else 0.95) * fade
				if pts.size() >= 3 and not Geometry2D.triangulate_polygon(pts).is_empty():
					glow.draw_colored_polygon(pts, col)
			glow.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
		"flare":
			var r: float = e["r"] * (0.7 + 0.5 * k); var a := (1.0 - k) * (1.0 - k)
			var p := Vector2(e["x"], e["y"])
			glow.draw_texture_rect(radial, Rect2(p - Vector2(r, r), Vector2(r, r) * 2.0), false, Color(e["col"], 0.55 * a))
			glow.draw_texture_rect(radial, Rect2(p - Vector2(r, r) * 0.3, Vector2(r, r) * 0.6), false, Color(1, 1, 0.98, 0.9 * a))
		"ring":
			var s := 1.0 + k * 2.6; var a2 := 1.0 - k
			var pts2 := PackedVector2Array()
			for i in 33:
				var an := TAU * i / 32.0
				pts2.append(Vector2(e["x"] + cos(an) * e["rx"] * s, e["y"] + sin(an) * e["ry"] * s))
			glow.draw_polyline(pts2, Color(e["col"], 0.8 * a2), e["width"] * (1.0 - k * 0.7), true)
		"art":
			var m: Dictionary = e["m"]
			var nf: int = m["n"]
			var i: int = (int(e["t"] / e["loop"] * nf) % nf) if e["loop"] > 0 else mini(nf - 1, int(k * nf))
			if e["follow"] and is_instance_valid(e["follow"]):
				e["x"] = e["follow"].cx + e["ox"]; e["y"] = e["follow"].pos.y + e["oy"]
			var s2: float = e["h"] / float(m["h"]); var w: float = m["w"] * s2; var h: float = m["h"] * s2
			var fade2: float = minf(1.0, minf((e["life"] - e["t"]) / 0.15, e["t"] / 0.1)) if e["loop"] > 0 else 1.0
			var ci: CanvasItem = glow if e["add"] else self
			ci.draw_set_transform(Vector2(e["x"], e["y"]), 0, Vector2(-1 if e["dir"] < 0 else 1, 1))
			ci.draw_texture_rect_region(art_tex, Rect2(-w / 2, -h if m["anchor"] == "bottom" else -h / 2, w, h), Rect2(i * m["w"], m["y"], m["w"], m["h"]), Color(1, 1, 1, fade2 * e["alpha"]))
			ci.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

## luz dos clarões (passagem de iluminação do jogo web)
func flare_lights() -> Array:
	var out := []
	for e in list:
		if e["type"] == "flare" and e["r"] > 12:
			out.append({"p": Vector2(e["x"], e["y"]), "r": e["r"] * 4, "c": e["col"], "i": 0.6 * (1.0 - e["t"] / e["life"])})
	return out
