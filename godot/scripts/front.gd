extends Node2D
## Primeiro plano em silhueta (paralaxe 1,25) — porte de Deco.drawFront (js/render/deco.js):
## tufos de erva e cardos ao vento (Região 1), colunas translúcidas (Santuário), correntes a balançar (Cripta).

var world
var items: Array = []
var region := ""
var time := 0.0
const INK := Color("#030204")

func _process(delta: float) -> void:
	time += delta
	queue_redraw()

func _h(q: float, f: Dictionary) -> float:
	var v := sin(q * 127.1 + float(f["s"]) * 311.7 + float(f["x"]) * 0.013) * 43758.5453
	return v - floor(v)

func _draw() -> void:
	if world == null or world.room == null or items.is_empty():
		return
	var vs := get_viewport_rect().size
	var z: float = world.cam.zoom.x
	var vw := vs.x / z; var vh := vs.y / z
	var cam: Vector2 = world.cam.get_screen_center_position() - Vector2(vw, vh) / 2.0
	var par := 1.25
	# a transformação de paralaxe: x do mundo * 1,25 e câmara * 1,25
	position = Vector2(cam.x - cam.x * par, 0)
	var ph: float = world.room.size_px().y
	for f in items:
		var x: float = float(f["x"]) * 1.25
		if x < cam.x * par - 80 or x > cam.x * par + vw + 80:
			continue
		var wind := sin(time * 1.5 + x * 0.019) * 0.6 + sin(time * 2.6 + x * 0.047) * 0.25 + sin(time * 0.37 + float(f["s"]) * 9.0) * 0.3
		var s: float = f["s"]
		if f["top"]:
			var y := -4.0
			if cam.y > 130:
				continue
			if region in ["r3", "r6", "crypt"]:
				var sw := sin(time * 0.9 + x * 0.013) * 0.05
				var yy := y
				while yy < y + 40 + s * 60:
					draw_set_transform(Vector2(x + (yy - y) * sw, yy), sw, Vector2(2.5, 3.6))
					draw_circle(Vector2.ZERO, 1.0, INK)
					yy += 6.0
				draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
			continue
		var y2 := ph + 6.0
		if cam.y + vh < ph - 110:
			continue
		if region in ["r4", "r1"]:
			var n := 7 + int(floor(s * 5))
			for i in n:
				var bx := x + (_h(i, f) - 0.5) * 46.0
				var hh := 16.0 + _h(i + 0.31, f) * (26.0 + s * 34.0)
				var w := 2.6 + _h(i + 0.93, f) * 3.4
				var lean := (_h(i + 0.67, f) - 0.5) * 26.0 + wind * hh * (0.12 + _h(i + 0.11, f) * 0.1)
				var pts := PackedVector2Array()
				_q(Vector2(bx - w / 2, y2), Vector2(bx + lean * 0.2 - w * 0.3, y2 - hh * 0.62), Vector2(bx + lean, y2 - hh), pts)
				_q(Vector2(bx + lean, y2 - hh), Vector2(bx + lean * 0.35 + w * 0.4, y2 - hh * 0.5), Vector2(bx + w / 2, y2), pts)
				if not Geometry2D.triangulate_polygon(pts).is_empty():
					draw_colored_polygon(pts, INK)
			for i in 2:
				var sx := x + (_h(i + 5.1, f) - 0.5) * 30.0
				var sh := 40.0 + _h(i + 5.5, f) * 36.0
				var sl := (_h(i + 5.9, f) - 0.5) * 18.0 + wind * sh * 0.16
				var line := PackedVector2Array()
				_q(Vector2(sx, y2), Vector2(sx + sl * 0.2, y2 - sh * 0.6), Vector2(sx + sl, y2 - sh), line)
				line.append(Vector2(sx + sl, y2 - sh))
				draw_polyline(line, INK, 1.1, true)
				draw_set_transform(Vector2(sx + sl, y2 - sh - 2.5), sl * 0.03, Vector2(2.0, 3.4))
				draw_circle(Vector2.ZERO, 1.0, INK)
				draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
		elif region in ["r6", "r7", "sanct"]:
			if f.get("arena", false):
				continue
			var w2 := 12.0 + s * 8.0
			draw_rect(Rect2(x, cam.y - 10, w2, vh + 20), Color(INK, 0.62))
			draw_rect(Rect2(x - 3, cam.y - 10, 3, vh + 20), Color(INK, 0.35))
			draw_rect(Rect2(x + w2, cam.y - 10, 3, vh + 20), Color(INK, 0.35))

func _q(p0: Vector2, c0: Vector2, p1: Vector2, out: PackedVector2Array) -> void:
	for i in 7:
		var u := i / 7.0
		out.append(p0.lerp(c0, u).lerp(c0.lerp(p1, u), u))
