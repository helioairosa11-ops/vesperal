extends Node2D
## Partículas leves desenhadas à mão: pó, faíscas, sangue/cinza, brasas, orbes de cinza.
## Dois nós: normal e aditivo (brilho).

var parts: Array = []
var glow: Node2D

func _ready() -> void:
	glow = Node2D.new()
	var m := CanvasItemMaterial.new()
	m.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	glow.material = m
	glow.z_index = 20
	glow.draw.connect(_draw_glow)
	add_child(glow)
	z_index = 15

func emit(p: Vector2, v: Vector2, life: float, sz: float, c: Color, add := false, g := 0.0, shrink := true) -> void:
	parts.append({"p": p, "v": v, "life": life, "max": life, "s": sz, "c": c, "add": add, "g": g, "shrink": shrink})

func burst(p: Vector2, n: int, c: Color, speed := 100.0, add := false) -> void:
	for i in n:
		var a := randf() * TAU
		emit(p, Vector2(cos(a), sin(a)) * speed * randf_range(0.3, 1.0), randf_range(0.3, 0.7), randf_range(1.0, 2.6), c, add, 200.0)

func dust(p: Vector2, n: int) -> void:
	for i in n:
		emit(p + Vector2(randf_range(-8, 8), 0), Vector2(randf_range(-60, 60), randf_range(-70, -10)), randf_range(0.4, 0.8), randf_range(1.5, 3.0), Color(0.42, 0.36, 0.3, 0.8), false, 160.0)

func sparks(p: Vector2, n: int) -> void:
	for i in n:
		var a := randf() * TAU
		emit(p, Vector2(cos(a), sin(a)) * randf_range(80, 260), randf_range(0.15, 0.4), randf_range(0.8, 1.6), Color(1, 0.9, 0.6), true, 300.0)

func blood(p: Vector2, n: int, dir: int) -> void:
	for i in n:
		emit(p, Vector2(dir * randf_range(30, 160), randf_range(-140, 20)), randf_range(0.3, 0.6), randf_range(1.0, 2.2), Color(0.55, 0.08, 0.08), false, 500.0)

func hit(p: Vector2, dir: float) -> void:
	for i in 10:
		emit(p, Vector2(dir * randf_range(40, 200), randf_range(-120, 60)), randf_range(0.15, 0.35), randf_range(0.8, 1.8), Color(1, 0.85, 0.6), true, 200.0)
	for i in 6:
		emit(p, Vector2(dir * randf_range(20, 90), randf_range(-60, 30)), randf_range(0.3, 0.6), randf_range(1.2, 2.4), Color(0.5, 0.45, 0.42), false, 300.0)

func ember(p: Vector2) -> void:
	emit(p, Vector2(randf_range(-12, 12), randf_range(-50, -20)), randf_range(0.4, 0.9), randf_range(0.8, 1.6), Color(1, 0.55, 0.2), true, -20.0)

func stun(p: Vector2) -> void:
	for i in 8:
		var a := TAU * i / 8.0
		emit(p, Vector2(cos(a), sin(a) * 0.4) * 50.0, 0.5, 1.6, Color(1, 0.92, 0.6), true, 0.0)

func ash_orbs(p: Vector2, n: int) -> void:
	for i in n:
		emit(p, Vector2(randf_range(-60, 60), randf_range(-160, -60)), randf_range(0.8, 1.3), 2.0, Color(1, 0.75, 0.45), true, 260.0, false)

func step(dt: float) -> void:
	for q in parts:
		q["life"] -= dt
		q["v"].y += q["g"] * dt
		q["p"] += q["v"] * dt
		q["v"] *= 0.985
	parts = parts.filter(func(q): return q["life"] > 0)
	queue_redraw(); glow.queue_redraw()

func _draw() -> void:
	for q in parts:
		if q["add"]:
			continue
		var k: float = q["life"] / q["max"]
		var s: float = q["s"] * (k if q["shrink"] else 1.0)
		draw_rect(Rect2(q["p"] - Vector2(s, s) / 2, Vector2(s, s)), Color(q["c"], q["c"].a * minf(1.0, k * 2.0)))

func _draw_glow() -> void:
	for q in parts:
		if not q["add"]:
			continue
		var k: float = q["life"] / q["max"]
		var s: float = q["s"] * (k if q["shrink"] else 1.0)
		glow.draw_circle(q["p"], s * 1.8, Color(q["c"], 0.25 * k))
		glow.draw_rect(Rect2(q["p"] - Vector2(s, s) / 2, Vector2(s, s)), Color(q["c"], k))
