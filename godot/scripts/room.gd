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
var layers: Dictionary = {}
var back_tex: Texture2D
var tiles_tex: Texture2D
var time := 0.0

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
	# camadas gravadas do jogo web (tools/export_room_layers.py): fundo + adereços, tiles, chamas, luzes, primeiro plano
	layers = {}
	var lp := "res://art/rooms/%s.json" % room_id
	if FileAccess.file_exists(lp):
		layers = JSON.parse_string(FileAccess.get_file_as_string(lp))
		back_tex = load("res://art/rooms/%s_back.png" % room_id)
		tiles_tex = load("res://art/rooms/%s_tiles.png" % room_id)
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

## linha de vista: nenhum tile sólido entre a e b (passos de 6 unidades)
func ray_clear(a: Vector2, b: Vector2) -> bool:
	var d := b - a
	var n := int(ceil(d.length() / 6.0))
	for i in range(1, n):
		if solid_at(a + d * (float(i) / n)):
			return false
	return true

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

func _process(delta: float) -> void:
	time += delta
	if not layers.is_empty() and not layers.get("flames", []).is_empty():
		queue_redraw()

func _draw() -> void:
	if not layers.is_empty():
		_draw_layers(); return
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

# ------------------------------------------------------------------ camadas do jogo web
func _draw_layers() -> void:
	var sz := size_px()
	draw_texture_rect(back_tex, Rect2(Vector2.ZERO, sz), false)
	# chamas dos adereços (Deco.flame / fireArt), animadas
	for f in layers["flames"]:
		if f["t"] == "flame":
			_flame(float(f["x"]), float(f["y"]), float(f["s"]), float(f["seed"]))
		elif f["t"] == "fire":
			_fire_art(f["flames"], float(f["hk"]), float(f["seed"]))
	draw_texture_rect(tiles_tex, Rect2(Vector2.ZERO, sz), false)
	_draw_planks()
	# blocos partidos (paredes falsas desfeitas): tapa com o fundo escuro
	for b in broken:
		draw_rect(Rect2(b.x * T, b.y * T, T, T), Color(0, 0, 0, 0))

## plataformas de madeira (=): tábuas com veio, juntas, pregos, rebordo claro e sombra por baixo,
## por cima da trave lisa do jogo web
func _draw_planks() -> void:
	var wood := Color("#4a3426"); var wood_d := Color("#2e1f17"); var wood_l := Color("#7a5a40")
	var snow: bool = String(def.get("region", "r1")) == "r1"
	for ty in h:
		var tx := 0
		while tx < grid[ty].size():
			if grid[ty][tx] != "=":
				tx += 1; continue
			var x0 := tx
			while tx < grid[ty].size() and grid[ty][tx] == "=":
				tx += 1
			var x := x0 * T; var w := (tx - x0) * T; var y := ty * T
			draw_rect(Rect2(x - 1, y + 5, w + 2, 4), Color(0, 0, 0, 0.35))
			draw_rect(Rect2(x - 1, y - 0.5, w + 2, 5.5), wood_d)
			draw_rect(Rect2(x, y, w, 4.5), wood)
			draw_rect(Rect2(x, y, w, 1), wood_l)
			draw_rect(Rect2(x, y + 3.5, w, 1), Color(wood_d, 0.9))
			var k := 0
			var px := float(x)
			while px < x + w:
				var pw := 11.0 + float((x0 * 7 + k * 13) % 9)
				var e := minf(px + pw, x + w)
				# veio
				draw_line(Vector2(px + 1, y + 2), Vector2(e - 2, y + 2.2), Color(wood_d, 0.55), 0.5)
				if e < x + w:
					draw_line(Vector2(e, y), Vector2(e, y + 4.5), wood_d, 0.8)
					draw_rect(Rect2(e - 2.2, y + 1.2, 0.9, 0.9), Color("#9a948c"))
					draw_rect(Rect2(e + 1.3, y + 1.2, 0.9, 0.9), Color("#9a948c"))
				px = e; k += 1
			if snow:
				var sx := float(x)
				while sx < x + w:
					var sw := 3.0 + float((int(sx) * 31) % 7)
					draw_rect(Rect2(sx, y - 1, minf(sw, x + w - sx), 1), Color(0.86, 0.88, 0.92, 0.55))
					sx += sw + 2.0 + float((int(sx) * 17) % 5)

func _q(p0: Vector2, c0: Vector2, p1: Vector2, out: PackedVector2Array) -> void:
	for i in 6:
		var u := i / 6.0
		out.append(p0.lerp(c0, u).lerp(c0.lerp(p1, u), u))

## chama viva: gota com núcleo claro, a tremeluzir (deco.js flame)
func _flame(x: float, y: float, s: float, sd: float) -> void:
	var fv := sin(time * 13.0 + sd * 7.1) * 0.5 + sin(time * 21.0 + sd * 3.3) * 0.5
	var hh := (2.6 + fv * 0.5) * s; var ww := 1.05 * s; var lean := sin(time * 5.0 + sd) * 0.35 * s
	var pts := PackedVector2Array()
	_q(Vector2(x - ww, y), Vector2(x - ww * 1.1, y - hh * 0.5), Vector2(x + lean, y - hh), pts)
	_q(Vector2(x + lean, y - hh), Vector2(x + ww * 1.1, y - hh * 0.5), Vector2(x + ww, y), pts)
	_q(Vector2(x + ww, y), Vector2(x, y + ww * 0.6), Vector2(x - ww, y), pts)
	if not Geometry2D.triangulate_polygon(pts).is_empty():
		draw_colored_polygon(pts, Color(1.0, 120 / 255.0, 40 / 255.0, 0.9))
	var p2 := PackedVector2Array()
	_q(Vector2(x - ww * 0.45, y), Vector2(x - ww * 0.5, y - hh * 0.4), Vector2(x + lean * 0.6, y - hh * 0.68), p2)
	_q(Vector2(x + lean * 0.6, y - hh * 0.68), Vector2(x + ww * 0.5, y - hh * 0.4), Vector2(x + ww * 0.45, y), p2)
	if not Geometry2D.triangulate_polygon(p2).is_empty():
		draw_colored_polygon(p2, Color("#ffe9a8"))

var _fx_art: Texture2D
func _fire_art(flames: Array, hk: float, sd: float) -> void:
	if _fx_art == null:
		_fx_art = Data.tex("res://art/sprites/fx_art.png")
	var cxs := 0.0; var by := -1e9; var mx := 0.0
	for q in flames:
		cxs += q[0]; by = maxf(by, q[1]); mx = maxf(mx, q[2])
	cxs /= flames.size()
	var i := 2 + (int(floor(time * 10.0 + sd * 17.0)) % 3)
	var fh := mx * hk; var fw := 53.0 * fh / 81.0
	draw_texture_rect_region(_fx_art, Rect2(cxs - fw / 2.0, by + fh * 0.12 - fh, fw, fh), Rect2(i * 53, 0, 53, 81), Color(1.4, 1.2, 1.0, 1))
