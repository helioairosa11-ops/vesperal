extends Node2D
## Fundo da região — porte de BG.drawSky + BG.draw (js/render/backgrounds.js):
## céu em degradê, a pintura da região a deslizar devagar, e os planos de paralaxe (faixas de 960×360 que emendam),
## gravados do jogo web por tools/export_room_layers.py. Segue a câmara; desenha em unidades do mundo do ecrã.

var world
var bset: Dictionary = {}
var layers: Array = []      # [{tex, p, topRow}]
var art: Texture2D
var sky: Array = []
var haze := Color(0, 0, 0, 0)
var stone_dark := Color.BLACK
var region_key := ""

func use_region(key: String) -> void:
	if key == region_key:
		return
	region_key = key
	layers.clear(); art = null
	var path := "res://art/bglayers/%s.json" % key
	if not FileAccess.file_exists(path):
		return
	bset = JSON.parse_string(FileAccess.get_file_as_string(path))
	var a: String = String(bset.get("art", "")).split("?")[0]
	if a != "" and ResourceLoader.exists("res://art/bg/" + a):
		art = Data.tex("res://art/bg/" + a)
	sky = []
	for c in bset.get("sky", []):
		sky.append(Data.color(c))
	haze = Data.color(String(bset.get("haze", "rgba(0,0,0,0)")))
	stone_dark = Data.color(String(bset.get("stoneDark", "#000000")))
	for i in bset["layers"].size():
		var L: Dictionary = bset["layers"][i]
		layers.append({"tex": Data.tex("res://art/bglayers/%s_L%d.png" % [key, i]), "p": float(L["p"]), "topRow": L["topRow"]})

func _process(_d: float) -> void:
	queue_redraw()

func _draw() -> void:
	if world == null or world.room == null:
		return
	var vs := get_viewport_rect().size
	var z: float = world.cam.zoom.x
	var vw := vs.x / z; var vh := vs.y / z
	var center: Vector2 = world.cam.get_screen_center_position()
	var cam := center - Vector2(vw, vh) / 2.0
	position = cam
	var room_h: float = world.room.size_px().y
	# a câmara do fundo anda no mundo inteiro (a posição da sala conta), como bcam no jogo web
	var bx: float = cam.x + world.room.gx
	# céu
	if sky.size() >= 3:
		var p := PackedVector2Array([Vector2(0, 0), Vector2(vw, 0), Vector2(vw, vh * 0.6), Vector2(0, vh * 0.6)])
		draw_polygon(p, PackedColorArray([sky[0], sky[0], sky[1], sky[1]]))
		var p2 := PackedVector2Array([Vector2(0, vh * 0.6), Vector2(vw, vh * 0.6), Vector2(vw, vh), Vector2(0, vh)])
		draw_polygon(p2, PackedColorArray([sky[1], sky[1], sky[2], sky[2]]))
	# pintura da região (drawArt)
	if art:
		var k := maxf(vw * 1.25 / art.get_width(), vh * 1.12 / art.get_height())
		var w := art.get_width() * k; var h := art.get_height() * k
		var span := w - vw
		var px := fposmod(bx * 0.035, span * 2.0)
		var x := -(span * 2.0 - px if px > span else px)
		var max_y := maxf(0.0, room_h - vh)
		var y := -(h - vh) * (clampf(cam.y / max_y, 0, 1) if max_y > 0 else 0.6)
		draw_texture_rect(art, Rect2(x, y, w, h), false)
	var LW: float = bset.get("LW", 960.0); var LH: float = bset.get("LH", 360.0)
	for li in layers.size():
		var L: Dictionary = layers[li]
		if art and (li == 0 or L["topRow"]):
			continue
		var ox := -fmod(bx * L["p"], LW)
		var max_y2 := maxf(0.0, room_h - vh)
		var oy: float = (max_y2 - cam.y) * L["p"] * 0.5 if max_y2 > 0 else 0.0
		var x2 := ox - LW
		while x2 < vw + LW:
			if x2 + LW >= 0 and x2 <= vw:
				draw_texture_rect(L["tex"], Rect2(x2, oy, LW + 0.5, LH), false)
			x2 += LW
		if oy > 0:
			draw_rect(Rect2(0, oy + LH - 1, vw, vh), stone_dark)
	if haze.a > 0:
		draw_rect(Rect2(0, 0, vw, vh), haze)
