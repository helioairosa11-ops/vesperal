class_name Room
extends Node2D
## Uma sala: grelha de tiles, colisões (porte fiel de World.moveBody do jogo web) e desenho da pedra.

const T := 20
const SOLID := {"#": true, "C": true, "F": true, "X": true}

var id := ""
var def: Dictionary = {}
var grid: Array = []          # Array de PackedStringArray por linha (um carácter por tile)
var w := 0
var h := 0
var gx := 0.0                  # origem global da sala (unidades)
var gy := 0.0
var reg: Dictionary = {}
var broken: Dictionary = {}
var dyn: Dictionary = {}      # tiles sólidos dinâmicos (portões fechados)
var stone_tex: Texture2D

func setup(room_id: String) -> void:
	id = room_id
	def = Data.rooms[room_id]
	grid.clear()
	for row in def["map"]:
		var r := String(row)
		var line := PackedStringArray()
		for i in r.length():
			line.append(r[i])
		grid.append(line)
	h = grid.size()
	w = 0
	for r in grid:
		w = max(w, r.size())
	gx = float(def["x"]) * Data.CELL_W * T
	gy = float(def["y"]) * Data.CELL_H * T
	reg = Data.region(String(def.get("region", "r1")))
	stone_tex = Data.tex("res://art/tiles/stone.png")
	texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	queue_redraw()

func size_px() -> Vector2:
	return Vector2(w * T, h * T)

func tile(tx: int, ty: int) -> String:
	if tx < 0 or ty < 0 or ty >= h or tx >= grid[ty].size():
		return ""
	return grid[ty][tx]

func is_solid_tile(tx: int, ty: int) -> bool:
	var ch := tile(tx, ty)
	if ch == "":
		return _outside_solid(tx, ty)
	if dyn.has(Vector2i(tx, ty)):
		return true
	if SOLID.has(ch):
		return not broken.has(Vector2i(tx, ty))
	return false

## fora dos limites: passável apenas se a sala vizinha tiver espaço livre nesse ponto
func _outside_solid(tx: int, ty: int) -> bool:
	var gtx := int(def["x"]) * Data.CELL_W + tx
	var gty := int(def["y"]) * Data.CELL_H + ty
	var nb := Data.room_at_cell(Vector2i(floori(float(gtx) / Data.CELL_W), floori(float(gty) / Data.CELL_H)))
	if nb == "" or nb == id:
		return true
	var nd: Dictionary = Data.rooms[nb]
	var lx := gtx - int(nd["x"]) * Data.CELL_W
	var ly := gty - int(nd["y"]) * Data.CELL_H
	if ly < 0 or ly >= nd["map"].size():
		return true
	var row := String(nd["map"][ly])
	if lx < 0 or lx >= row.length():
		return true
	return SOLID.has(row[lx])

func is_platform(tx: int, ty: int) -> bool:
	return tile(tx, ty) == "="

func is_hazard(tx: int, ty: int) -> bool:
	var ch := tile(tx, ty)
	return ch == "^" or ch == "L"

func solid_at(p: Vector2) -> bool:
	return is_solid_tile(floori(p.x / T), floori(p.y / T))

func rect_solid(r: Rect2) -> bool:
	var x0 := floori(r.position.x / T)
	var x1 := floori((r.position.x + r.size.x - 0.001) / T)
	var y0 := floori(r.position.y / T)
	var y1 := floori((r.position.y + r.size.y - 0.001) / T)
	for ty in range(y0, y1 + 1):
		for tx in range(x0, x1 + 1):
			if is_solid_tile(tx, ty):
				return true
	return false

## move um corpo AABB (b.pos = canto superior esquerdo, b.size, b.vel) contra a grelha
func move_body(b, dt: float) -> Dictionary:
	var res := {"hit_x": 0, "hit_y": 0, "landed": false, "ceiling": false}
	var dx: float = b.vel.x * dt
	var sx := signf(dx)
	while absf(dx) > 0.0:
		var step := sx * 4.0 if absf(dx) > 4.0 else dx
		b.pos.x += step
		if rect_solid(Rect2(b.pos, b.size)):
			b.pos.x -= step
			var s := step
			for i in 6:
				s /= 2.0
				b.pos.x += s
				if rect_solid(Rect2(b.pos, b.size)):
					b.pos.x -= s
			res["hit_x"] = int(sx); b.vel.x = 0.0
			break
		dx -= step
	var dy: float = b.vel.y * dt
	var sy := signf(dy)
	var was_bottom: float = b.pos.y + b.size.y
	b.on_ground = false
	while absf(dy) > 0.0:
		var step := sy * 4.0 if absf(dy) > 4.0 else dy
		b.pos.y += step
		var blocked := rect_solid(Rect2(b.pos, b.size))
		if not blocked and sy > 0 and not b.drop_through:
			var bottom: float = b.pos.y + b.size.y
			var ty := floori(bottom / T)
			if bottom - ty * T <= absf(step) + 0.5 and was_bottom <= ty * T + 0.5:
				for tx in range(floori(b.pos.x / T), floori((b.pos.x + b.size.x - 0.01) / T) + 1):
					if is_platform(tx, ty):
						b.pos.y = ty * T - b.size.y
						res["landed"] = true; b.on_ground = true; b.vel.y = 0.0
						return _ground_check(b, res)
		if blocked:
			b.pos.y -= step
			var s := step
			for i in 6:
				s /= 2.0
				b.pos.y += s
				if rect_solid(Rect2(b.pos, b.size)):
					b.pos.y -= s
			if sy > 0:
				res["landed"] = true; b.on_ground = true
			else:
				res["ceiling"] = true
			res["hit_y"] = int(sy); b.vel.y = 0.0
			break
		dy -= step
	return _ground_check(b, res)

func _ground_check(b, res: Dictionary) -> Dictionary:
	if not b.on_ground and b.vel.y >= 0:
		b.pos.y += 1
		if rect_solid(Rect2(b.pos, b.size)):
			b.on_ground = true
		elif not b.drop_through:
			var bottom: float = b.pos.y + b.size.y
			var ty := floori(bottom / T)
			if bottom - ty * T < 1.2:
				for tx in range(floori(b.pos.x / T), floori((b.pos.x + b.size.x - 0.01) / T) + 1):
					if is_platform(tx, ty):
						b.on_ground = true
		b.pos.y -= 1
	return res

## chão por baixo de um ponto (para pousar coisas)
func floor_below(x: float, y: float, max_d := 400.0) -> float:
	var d := 0.0
	while d < max_d:
		if solid_at(Vector2(x, y + d)) or is_platform(floori(x / T), floori((y + d) / T)):
			return floori((y + d) / T) * T
		d += 4.0
	return y

# ------------------------------------------------------------------ desenho
func _solid_mask(tx: int, ty: int) -> bool:
	var ch := tile(tx, ty)
	if ch == "":
		return true
	return SOLID.has(ch) and not broken.has(Vector2i(tx, ty))

func _draw() -> void:
	var stone: Color = Data.color(reg.get("stone", "#2f2e36"))
	var light: Color = Data.color(reg.get("stoneLight", "#5d5762"))
	var dark: Color = Data.color(reg.get("stoneDark", "#121117"))
	var top: Color = Data.color(reg.get("top", "#9a8f8a"))
	var accent: Color = Data.color(reg.get("topAccent", "#b8aba3"))
	# tom da pedra: textura pintada, tingida com a cor da região (como no jogo web)
	var tint := Color(0.62, 0.6, 0.66).lerp(stone.lightened(0.35), 0.5)
	var k := stone_tex.get_width() / 128.0
	for ty in h:
		for tx in w:
			var ch := tile(tx, ty)
			if ch == "":
				continue
			var r := Rect2(tx * T, ty * T, T, T)
			if SOLID.has(ch):
				if broken.has(Vector2i(tx, ty)):
					continue
				var src := Rect2(fposmod(tx * T, 128.0) * k, fposmod(ty * T, 128.0 * stone_tex.get_height() / stone_tex.get_width()) * k, T * k, T * k)
				var c := tint
				if ch == "C":
					c = tint.darkened(0.12)
				draw_texture_rect_region(stone_tex, r, src, c)
				# profundidade: quanto mais longe do ar, mais escuro
				var open_u := not _solid_mask(tx, ty - 1)
				var open_d := not _solid_mask(tx, ty + 1)
				var open_l := not _solid_mask(tx - 1, ty)
				var open_r := not _solid_mask(tx + 1, ty)
				var deep := not (open_u or open_d or open_l or open_r)
				if deep:
					var far := _solid_mask(tx, ty - 2) and _solid_mask(tx, ty + 2) and _solid_mask(tx - 2, ty) and _solid_mask(tx + 2, ty)
					draw_rect(r, Color(dark, 0.55 if far else 0.32))
				if open_u:
					draw_rect(Rect2(r.position, Vector2(T, 3)), top)
					draw_rect(Rect2(r.position + Vector2(0, 3), Vector2(T, 1.5)), Color(accent, 0.55))
					draw_rect(Rect2(r.position + Vector2(0, 4.5), Vector2(T, 3)), Color(0, 0, 0, 0.25))
				if open_d:
					draw_rect(Rect2(r.position + Vector2(0, T - 2.5), Vector2(T, 2.5)), Color(dark, 0.9))
				if open_l:
					draw_rect(Rect2(r.position, Vector2(1.5, T)), Color(light, 0.45))
				if open_r:
					draw_rect(Rect2(r.position + Vector2(T - 2, 0), Vector2(2, T)), Color(dark, 0.7))
			elif ch == "=":
				# plataforma de pedra fina com sombra por baixo
				var src2 := Rect2(fposmod(tx * T, 128.0) * k, 10 * k, T * k, 6 * k)
				draw_texture_rect_region(stone_tex, Rect2(r.position, Vector2(T, 6)), src2, tint)
				draw_rect(Rect2(r.position, Vector2(T, 2)), top)
				draw_rect(Rect2(r.position + Vector2(0, 6), Vector2(T, 3)), Color(0, 0, 0, 0.35))
			elif ch == "^":
				var pts := PackedVector2Array()
				for i in 4:
					var x0 := r.position.x + i * 5.0
					pts = PackedVector2Array([Vector2(x0, r.end.y), Vector2(x0 + 2.5, r.end.y - 11), Vector2(x0 + 5, r.end.y)])
					draw_colored_polygon(pts, Color(0.55, 0.5, 0.5))
					draw_line(pts[0], pts[1], Color(0.85, 0.8, 0.78), 0.8)
			elif ch == "~":
				draw_rect(r, Color(0.15, 0.25, 0.32, 0.55))
			elif ch == "L":
				draw_rect(r, Color(1.0, 0.45, 0.1, 0.9))
