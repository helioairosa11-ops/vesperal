extends CanvasLayer
## Painéis do jogo (como .panel do jogo web): memórias, ações da memória, confirmação, definições com separadores,
## pausa e créditos. Teclado, rato e comando. Desenhado à mão em px de CSS (ecrã de 900 de altura) e escalado.

signal closed_all

var stack: Array = []          # painéis abertos (o último está à frente)
var c: Control
var f_title: FontVariation
var f_body: FontVariation
var glow: Texture2D
var t := 0.0
var rebinding := ""            # ação à espera de uma tecla nova
var _rects: Array = []         # [{r, i}] linhas clicáveis do painel da frente
var _tab_rects: Array = []
var _drag := -1

const INK := Color("#e9dfcf")
const INK_DIM := Color("#a99f92")
const EMBER := Color("#ffb050")
const LINE := Color(214 / 255.0, 178 / 255.0, 120 / 255.0, 0.35)

func _ready() -> void:
	layer = 30
	process_mode = Node.PROCESS_MODE_ALWAYS
	c = Control.new()
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(c)
	c.draw.connect(_draw_ui)
	c.gui_input.connect(_gui)
	f_title = FontVariation.new(); f_title.base_font = load("res://art/fonts/Cinzel-VF.woff")
	f_title.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): 600}
	f_body = FontVariation.new(); f_body.base_font = load("res://art/fonts/EBGaramond-VF.woff")
	var g := Gradient.new()
	g.offsets = PackedFloat32Array([0.0, 1.0]); g.colors = PackedColorArray([Color(1, 1, 1, 1), Color(1, 1, 1, 0)])
	var gt := GradientTexture2D.new()
	gt.gradient = g; gt.fill = GradientTexture2D.FILL_RADIAL; gt.width = 64; gt.height = 64
	gt.fill_from = Vector2(0.5, 0.5); gt.fill_to = Vector2(1, 0.5)
	glow = gt

func is_open() -> bool:
	return not stack.is_empty()

func open(p: Dictionary) -> Dictionary:
	p.merge({"focus": 0, "tab": 0, "scroll": 0.0, "t": 0.0}, false)
	stack.append(p)
	c.mouse_filter = Control.MOUSE_FILTER_STOP
	Audio.sfx("ui_open")
	_skip_disabled(p, 1)
	return p

func close(p = null) -> void:
	if stack.is_empty():
		return
	if p == null:
		p = stack.back()
	stack.erase(p)
	if p.has("on_close"):
		p["on_close"].call()
	if stack.is_empty():
		c.mouse_filter = Control.MOUSE_FILTER_IGNORE
		closed_all.emit()

func close_all() -> void:
	while not stack.is_empty():
		close()

func _process(delta: float) -> void:
	t += delta
	if not stack.is_empty():
		stack.back()["t"] += delta
	c.queue_redraw()

# ------------------------------------------------------------------ itens do painel da frente
func _items(p: Dictionary) -> Array:
	if p.has("tabs"):
		return p["build"].call(p["tabs"][p["tab"]])
	return p.get("items", [])

func _selectable(it: Dictionary) -> bool:
	return it.get("type", "button") != "note" and it.get("type", "") != "header" and not it.get("disabled", false)

func _skip_disabled(p: Dictionary, d: int) -> void:
	var items := _items(p)
	if items.is_empty():
		return
	for i in items.size():
		var k: int = posmod(p["focus"] + i * d, items.size())
		if _selectable(items[k]):
			p["focus"] = k; return

func _move(d: int) -> void:
	var p: Dictionary = stack.back()
	var items := _items(p)
	if items.is_empty():
		return
	var start: int = p["focus"]
	for i in range(1, items.size() + 1):
		var k: int = posmod(start + i * d, items.size())
		if _selectable(items[k]):
			p["focus"] = k; break
	Audio.sfx("ui_move")

func _adjust(d: int) -> void:
	var p: Dictionary = stack.back()
	var items := _items(p)
	if items.is_empty():
		return
	var it: Dictionary = items[p["focus"]]
	match it.get("type", "button"):
		"slider":
			var v: float = clampf(it["get"].call() + d * it.get("step", 0.05), it.get("min", 0.0), it.get("max", 1.0))
			it["set"].call(snappedf(v, it.get("step", 0.05))); Audio.sfx("ui_tab")
		"choice":
			var opts: Array = it["opts"]
			var cur = it["get"].call()
			var idx := 0
			for i in opts.size():
				if opts[i][0] == cur: idx = i
			it["set"].call(opts[posmod(idx + d, opts.size())][0]); Audio.sfx("ui_tab")
		"toggle":
			it["set"].call(not it["get"].call()); Audio.sfx("ui_tab")
		_:
			if p.has("tabs"):
				_tab(d)

func _tab(d: int) -> void:
	var p: Dictionary = stack.back()
	if not p.has("tabs"):
		return
	p["tab"] = posmod(p["tab"] + d, p["tabs"].size()); p["focus"] = 0; p["scroll"] = 0.0
	_skip_disabled(p, 1)
	Audio.sfx("ui_tab")

func _activate() -> void:
	var p: Dictionary = stack.back()
	var items := _items(p)
	if items.is_empty():
		return
	var it: Dictionary = items[p["focus"]]
	if not _selectable(it):
		return
	match it.get("type", "button"):
		"toggle", "choice":
			_adjust(1)
		"key":
			rebinding = it["action"]; Audio.sfx("ui_ok")
		"slider":
			pass
		_:
			Audio.sfx("ui_ok")
			if it.has("action"):
				it["action"].call()

func back() -> void:
	if stack.is_empty():
		return
	var p: Dictionary = stack.back()
	Audio.sfx("ui_back")
	if p.has("on_back"):
		p["on_back"].call()
	else:
		close(p)

func _unhandled_input(e: InputEvent) -> void:
	if stack.is_empty():
		return
	if rebinding != "":
		if e is InputEventKey and e.pressed and not e.echo:
			if e.physical_keycode != KEY_ESCAPE:
				Settings.rebind(rebinding, e.physical_keycode)
			rebinding = ""
			get_viewport().set_input_as_handled()
		return
	if not e.is_pressed() or e.is_echo():
		if not (e is InputEventKey and e.is_pressed() and e.is_echo() and (e.is_action("ui_left") or e.is_action("ui_right") or e.is_action("ui_up") or e.is_action("ui_down"))):
			return
	if e.is_action("ui_up"): _move(-1)
	elif e.is_action("ui_down"): _move(1)
	elif e.is_action("ui_left"): _adjust(-1)
	elif e.is_action("ui_right"): _adjust(1)
	elif e is InputEventKey and e.physical_keycode == KEY_Q: _tab(-1)
	elif e is InputEventKey and e.physical_keycode == KEY_E and stack.back().has("tabs"): _tab(1)
	elif e is InputEventJoypadButton and e.button_index == JOY_BUTTON_LEFT_SHOULDER: _tab(-1)
	elif e is InputEventJoypadButton and e.button_index == JOY_BUTTON_RIGHT_SHOULDER: _tab(1)
	elif e.is_action("ui_accept") or e.is_action("jump") or e.is_action("attack"): _activate()
	elif e.is_action("ui_cancel") or e.is_action("pause") or e.is_action("dodge"): back()
	else: return
	get_viewport().set_input_as_handled()

func _gui(e: InputEvent) -> void:
	if stack.is_empty():
		return
	var p: Dictionary = stack.back()
	if e is InputEventMouseMotion:
		if _drag >= 0:
			_slide_to(e.position.x); return
		for r in _rects:
			if r["r"].has_point(e.position) and r["i"] != p["focus"] and _selectable(_items(p)[r["i"]]):
				p["focus"] = r["i"]; Audio.sfx("ui_move")
	elif e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT:
		if not e.pressed:
			_drag = -1; return
		for tab_r in _tab_rects:
			if tab_r["r"].has_point(e.position):
				p["tab"] = tab_r["i"]; p["focus"] = 0; p["scroll"] = 0.0; _skip_disabled(p, 1); Audio.sfx("ui_tab"); return
		for r in _rects:
			if r["r"].has_point(e.position):
				p["focus"] = r["i"]
				var it: Dictionary = _items(p)[r["i"]]
				if it.get("type", "") == "slider":
					_drag = r["i"]; _slide_to(e.position.x)
				else:
					_activate()
				return
	elif e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_RIGHT and e.pressed:
		back()
	elif e is InputEventMouseButton and e.pressed and (e.button_index == MOUSE_BUTTON_WHEEL_DOWN or e.button_index == MOUSE_BUTTON_WHEEL_UP):
		p["scroll"] = maxf(0.0, p["scroll"] + (40.0 if e.button_index == MOUSE_BUTTON_WHEEL_DOWN else -40.0))

var _slider_track := {}
func _slide_to(x: float) -> void:
	var p: Dictionary = stack.back()
	if not _slider_track.has(_drag):
		return
	var trk: Rect2 = _slider_track[_drag]
	var it: Dictionary = _items(p)[_drag]
	var k := clampf((x - trk.position.x) / trk.size.x, 0, 1)
	var v: float = lerpf(it.get("min", 0.0), it.get("max", 1.0), k)
	it["set"].call(snappedf(v, it.get("step", 0.05)))

# ------------------------------------------------------------------ desenho
func _draw_ui() -> void:
	_rects.clear(); _tab_rects.clear(); _slider_track.clear()
	if stack.is_empty():
		return
	var vs := c.get_viewport_rect().size
	var u := vs.y / 900.0
	# véu por trás dos painéis
	c.draw_rect(Rect2(Vector2.ZERO, vs), Color(0.02, 0.015, 0.025, 0.55))
	var p: Dictionary = stack.back()
	var kind: String = p.get("kind", "list")
	if kind == "credits":
		_draw_credits(p, vs, u); return
	var items := _items(p)
	var w: float = p.get("width", 460.0) * u
	var row_h: float = (p.get("row", 40.0)) * u
	var title_h := 64.0 * u if p.has("title") else 16.0 * u
	var tabs_h := 44.0 * u if p.has("tabs") else 0.0
	var rows_h := 0.0
	for it in items:
		rows_h += _row_h(it, u, row_h, w)
	var foot_h := 34.0 * u if p.has("foot") else 0.0
	var max_h := vs.y * 0.86
	var h := minf(max_h, title_h + tabs_h + rows_h + foot_h + 44.0 * u)
	var r := Rect2((vs.x - w) / 2.0, (vs.y - h) / 2.0, w, h)
	_panel_box(r, u, minf(1.0, p["t"] / 0.22))
	var y := r.position.y + 24.0 * u
	if p.has("title"):
		_center(f_title, String(p["title"]), vs.x / 2.0, y + 24.0 * u, 22.0 * u, Color("#f3e7d3"), 0.12)
		_ornament(vs.x / 2.0, y + 42.0 * u, u)
		y += title_h
	if p.has("tabs"):
		var labels: Array = p["tab_labels"]
		var tw := 0.0
		for l in labels:
			tw += _spaced_w(f_title, l, 14.0 * u, 0.08) + 20.0 * u
		var x := vs.x / 2.0 - tw / 2.0
		for i in labels.size():
			var lw := _spaced_w(f_title, labels[i], 14.0 * u, 0.08) + 20.0 * u
			var act: bool = i == p["tab"]
			_spaced(f_title, labels[i], Vector2(x + 10.0 * u, y + 20.0 * u), 14.0 * u, Color("#fff0d8") if act else INK_DIM, 0.08)
			if act:
				c.draw_line(Vector2(x + 6 * u, y + 28 * u), Vector2(x + lw - 6 * u, y + 28 * u), EMBER, 2.0 * u)
				var dc := Vector2(x + lw / 2.0, y + 32 * u)
				c.draw_colored_polygon(PackedVector2Array([dc + Vector2(0, -3.5 * u), dc + Vector2(3.5 * u, 0), dc + Vector2(0, 3.5 * u), dc + Vector2(-3.5 * u, 0)]), EMBER)
			_tab_rects.append({"r": Rect2(x, y, lw, 32 * u), "i": i})
			x += lw
		y += tabs_h
	# linhas (com deslocamento se não couberem)
	var area := Rect2(r.position.x, y, w, r.end.y - y - foot_h - 18.0 * u)
	var focus_y := 0.0; var acc := 0.0
	for i in items.size():
		if i == p["focus"]:
			focus_y = acc
		acc += _row_h(items[i], u, row_h, w)
	var sc: float = p["scroll"]
	if focus_y - sc > area.size.y - row_h * 1.5: sc = focus_y - area.size.y + row_h * 1.5
	if focus_y - sc < 0: sc = focus_y
	sc = clampf(sc, 0.0, maxf(0.0, acc - area.size.y))
	p["scroll"] = sc
	var yy := y - sc
	for i in items.size():
		var it: Dictionary = items[i]
		var rh := _row_h(it, u, row_h, w)
		if yy + rh > area.position.y - 1 and yy < area.end.y + 1:
			_draw_row(it, i == p["focus"], Rect2(r.position.x + 18 * u, yy, w - 36 * u, rh), u, i)
		yy += rh
	if p.has("foot"):
		_center(f_body, String(p["foot"]), vs.x / 2.0, r.end.y - 18.0 * u, 14.0 * u, INK_DIM, 0.0)

func _row_h(it: Dictionary, u: float, row_h: float, w: float) -> float:
	match it.get("type", "button"):
		"note":
			var sz := f_body.get_multiline_string_size(String(it["label"]), HORIZONTAL_ALIGNMENT_LEFT, w - 56 * u, int(13 * u))
			return sz.y + 14 * u
		"header":
			return 34 * u
		"slot":
			return 74 * u
	return row_h

func _draw_row(it: Dictionary, foc: bool, r: Rect2, u: float, i: int) -> void:
	var tp: String = it.get("type", "button")
	var dis: bool = it.get("disabled", false)
	var a := 0.35 if dis else 1.0
	if tp == "note":
		c.draw_multiline_string(f_body, r.position + Vector2(10 * u, 18 * u), String(it["label"]), HORIZONTAL_ALIGNMENT_LEFT, r.size.x - 20 * u, int(13 * u), -1, INK_DIM)
		return
	if tp == "header":
		_spaced(f_title, String(it["label"]).to_upper(), r.position + Vector2(10 * u, 24 * u), 13 * u, EMBER, 0.14)
		return
	_rects.append({"r": r, "i": i})
	if tp == "slot":
		# .slot: número em brasa, região, tempo/conclusão
		c.draw_rect(r.grow(-3 * u), Color(1, 0.59, 0.27, 0.08) if foc else Color(1, 1, 1, 0.02))
		c.draw_rect(r.grow(-3 * u), EMBER if foc else LINE, false, maxf(1.0, u))
		_center(f_title, str(it["n"]), r.position.x + 34 * u, r.position.y + r.size.y / 2.0 + 11 * u, 30 * u, EMBER, 0.0)
		if it.get("empty", false):
			c.draw_string(f_body, r.position + Vector2(70 * u, r.size.y / 2.0 + 6 * u), String(it["label"]), HORIZONTAL_ALIGNMENT_LEFT, -1, int(17 * u), INK_DIM)
		else:
			_spaced(f_title, String(it["label"]), r.position + Vector2(70 * u, 32 * u), 17 * u, INK, 0.04)
			c.draw_string(f_body, r.position + Vector2(70 * u, 56 * u), String(it["info"]), HORIZONTAL_ALIGNMENT_LEFT, -1, int(14 * u), INK_DIM)
		return
	if tp == "button":
		# .btn: centrado, com o losango em brasa à esquerda quando escolhido
		if foc and not dis:
			var g1 := Color(1, 0.59, 0.27, 0.0); var g2 := Color(1, 0.59, 0.27, 0.14)
			var mid := r.position.x + r.size.x / 2.0
			c.draw_polygon(PackedVector2Array([r.position, Vector2(mid, r.position.y), Vector2(mid, r.end.y), Vector2(r.position.x, r.end.y)]), PackedColorArray([g1, g2, g2, g1]))
			c.draw_polygon(PackedVector2Array([Vector2(mid, r.position.y), Vector2(r.end.x, r.position.y), r.end, Vector2(mid, r.end.y)]), PackedColorArray([g2, g1, g1, g2]))
			c.draw_rect(r, LINE, false, maxf(1.0, u))
			var dc := Vector2(r.position.x + 12 * u, r.position.y + r.size.y / 2.0)
			c.draw_texture_rect(glow, Rect2(dc - Vector2(8, 8) * u, Vector2(16, 16) * u), false, Color(1, 0.59, 0.27, 0.8))
			c.draw_colored_polygon(PackedVector2Array([dc + Vector2(0, -3.5 * u), dc + Vector2(3.5 * u, 0), dc + Vector2(0, 3.5 * u), dc + Vector2(-3.5 * u, 0)]), EMBER)
		_center(f_title, String(it["label"]), r.position.x + r.size.x / 2.0, r.position.y + r.size.y / 2.0 + 6 * u, 17 * u, Color(Color("#fff3dc") if foc else INK, a), 0.1)
		return
	# linhas de definição (.set-row)
	if foc:
		c.draw_rect(r, Color(1, 0.59, 0.27, 0.06))
		c.draw_rect(r, LINE, false, maxf(1.0, u))
	c.draw_string(f_body, r.position + Vector2(10 * u, r.size.y / 2.0 + 6 * u), String(it["label"]), HORIZONTAL_ALIGNMENT_LEFT, r.size.x * 0.55, int(16 * u), Color(INK, a))
	var rx := r.end.x - 10 * u
	var cy := r.position.y + r.size.y / 2.0
	match tp:
		"toggle":
			_right(f_title, Data.t("on") if it["get"].call() else Data.t("off"), rx, cy + 5 * u, 14 * u, EMBER)
		"choice":
			var cur = it["get"].call(); var lab := ""
			for o in it["opts"]:
				if o[0] == cur: lab = String(o[1])
			var s2 := ("‹  " + lab + "  ›") if foc else lab
			_right(f_title, s2, rx, cy + 5 * u, 14 * u, EMBER)
		"key":
			var lab2: String = Data.t("set_press_key") if rebinding == it["action"] else it["value"].call()
			_right(f_title, lab2, rx, cy + 5 * u, 14 * u, EMBER)
		"slider":
			var v: float = it["get"].call()
			var k := inverse_lerp(it.get("min", 0.0), it.get("max", 1.0), v)
			var tw := 150.0 * u
			var trk := Rect2(rx - tw - 56 * u, cy - 2 * u, tw, 4 * u)
			_slider_track[i] = Rect2(trk.position.x, r.position.y, trk.size.x, r.size.y)
			c.draw_rect(trk, Color(1, 1, 1, 0.12))
			c.draw_rect(Rect2(trk.position, Vector2(tw * k, trk.size.y)), Color("#c88a4a"))
			c.draw_circle(Vector2(trk.position.x + tw * k, cy), 6 * u, EMBER if foc else Color("#c88a4a"))
			var txt: String = it["fmt"].call(v) if it.has("fmt") else str(roundi(v * 100)) + "%"
			_right(f_body, txt, rx, cy + 5 * u, 14 * u, INK_DIM)
		"button_row":
			pass

func _draw_credits(p: Dictionary, vs: Vector2, u: float) -> void:
	var w := minf(vs.x * 0.92, 640 * u); var h := minf(vs.y * 0.9, 640 * u)
	var r := Rect2((vs.x - w) / 2.0, (vs.y - h) / 2.0, w, h)
	_panel_box(r, u, minf(1.0, p["t"] / 0.22))
	var y := r.position.y + 60 * u
	var cx := vs.x / 2.0
	_center(f_title, "VESPERAL", cx, y, 34 * u, Color("#f3e6d0"), 0.2); y += 34 * u
	_center(f_body, Data.t("subtitle"), cx, y, 17 * u, INK, 0.0); y += 30 * u
	var sections := [["cr_by", "Lourence Manuel"], ["cr_art_title", Data.t("cr_art")], ["cr_music_title", Data.t("cr_music")],
		["cr_engine_title", Data.t("cr_engine")], ["cr_langs_title", "English · Português · Español · Français"], ["cr_thanks_title", Data.t("cr_thanks")]]
	for sct in sections:
		_center(f_title, Data.t(sct[0]).to_upper(), cx, y + 18 * u, 15 * u, EMBER, 0.14); y += 26 * u
		_center(f_body, String(sct[1]), cx, y + 18 * u, 16 * u, INK, 0.0); y += 34 * u
	var br := Rect2(cx - 70 * u, r.end.y - 56 * u, 140 * u, 36 * u)
	_rects.append({"r": br, "i": 0})
	_draw_row({"label": Data.t("back")}, true, br, u, 0)

func _panel_box(r: Rect2, u: float, a: float) -> void:
	c.draw_rect(r.grow(6 * u), Color(0.047, 0.04, 0.055, 0.96 * a))
	c.draw_rect(r.grow(6 * u), Color(214 / 255.0, 178 / 255.0, 120 / 255.0, 0.35 * a), false, maxf(1.0, u))
	c.draw_rect(r, Color(0.047, 0.04, 0.055, 0.94 * a))
	c.draw_texture_rect(glow, Rect2(r.position.x - r.size.x * 0.1, r.position.y - r.size.y * 0.5, r.size.x * 1.2, r.size.y * 0.9), false, Color(0.24, 0.13, 0.09, 0.35 * a))
	c.draw_rect(r, Color(214 / 255.0, 178 / 255.0, 120 / 255.0, 0.5 * a), false, maxf(1.0, u))

func _ornament(cx: float, y: float, u: float) -> void:
	c.draw_line(Vector2(cx - 120 * u, y), Vector2(cx - 24 * u, y), Color(0.79, 0.64, 0.4, 0.6), maxf(1.0, u))
	c.draw_line(Vector2(cx + 24 * u, y), Vector2(cx + 120 * u, y), Color(0.79, 0.64, 0.4, 0.6), maxf(1.0, u))
	var d := 4.5 * u
	c.draw_colored_polygon(PackedVector2Array([Vector2(cx, y - d), Vector2(cx + d, y), Vector2(cx, y + d), Vector2(cx - d, y)]), Color("#c9a466"))

func _spaced_w(f: Font, s: String, fs: float, ls: float) -> float:
	var w := 0.0
	for ch in s:
		w += f.get_string_size(ch, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs)).x + fs * ls
	return w - fs * ls

func _spaced(f: Font, s: String, at: Vector2, fs: float, col: Color, ls: float) -> void:
	var x := at.x
	for ch in s:
		c.draw_string(f, Vector2(x, at.y), ch, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs), col)
		x += f.get_string_size(ch, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs)).x + fs * ls

func _center(f: Font, s: String, cx: float, y: float, fs: float, col: Color, ls: float) -> void:
	if ls > 0:
		_spaced(f, s, Vector2(cx - _spaced_w(f, s, fs, ls) / 2.0, y), fs, col, ls)
	else:
		var w := f.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs)).x
		c.draw_string(f, Vector2(cx - w / 2.0, y), s, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs), col)

func _right(f: Font, s: String, rx: float, y: float, fs: float, col: Color) -> void:
	var w := f.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs)).x
	c.draw_string(f, Vector2(rx - w, y), s, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs), col)

# ================================================================== ecrãs
func confirm(msg: String, yes: Callable) -> void:
	var p := {}
	p = open({"title": Data.t("pause_title") if false else "", "width": 520.0, "items": [
		{"type": "note", "label": msg},
		{"label": Data.t("yes"), "action": func(): close(p); yes.call()},
		{"label": Data.t("no"), "action": func(): close(p)},
	]})
	p.erase("title")

func _fmt_time(sec: float) -> String:
	var s := int(sec)
	return "%d:%02d:%02d" % [floori(s / 3600.0), floori(s / 60.0) % 60, s % 60]

## M.slots: três memórias
func open_slots(on_play: Callable) -> void:
	var items: Array = []
	for i in GameState.SLOTS:
		var m := GameState.slot_meta(i)
		if m.is_empty():
			items.append({"type": "slot", "n": i + 1, "empty": true, "label": Data.t("slot_empty"), "action": func(): close_all(); on_play.call(i, true)})
		else:
			var reg := "r1"
			if Data.rooms.has(String(m.get("room", ""))):
				reg = String(Data.rooms[String(m["room"])].get("region", "r1"))
			var emb := 0
			for k in range(1, 7):
				if m.get("flags", {}).get("ember_%d" % k, false): emb += 1
			var pct := clampi(int(round(m.get("bosses", {}).size() * 6.0 + m.get("flags", {}).size() * 0.5)), 0, 100)
			var info := Data.t("slot_info", {"time": _fmt_time(float(m.get("play_time", 0))), "embers": emb, "pct": pct})
			items.append({"type": "slot", "n": i + 1, "label": Data.t("reg_" + reg), "info": info, "action": func(): _slot_actions(i, on_play)})
	open({"title": Data.t("slots_title"), "width": 520.0, "items": items})

func _slot_actions(i: int, on_play: Callable) -> void:
	var p := {}
	p = open({"title": Data.t("slot_n", {"n": i + 1}), "width": 420.0, "items": [
		{"label": Data.t("slot_load"), "action": func(): close_all(); on_play.call(i, false)},
		{"label": Data.t("slot_new"), "action": func(): confirm(Data.t("confirm_overwrite"), func(): close_all(); GameState.erase(i); on_play.call(i, true))},
		{"label": Data.t("slot_erase"), "action": func(): confirm(Data.t("confirm_erase"), func():
			GameState.erase(i); close_all(); open_slots(on_play))},
		{"label": Data.t("back"), "action": func(): close(p)},
	]})

func open_credits() -> void:
	var p := {}
	p = open({"kind": "credits", "items": [{"label": Data.t("back"), "action": func(): close(p)}],
		"on_close": func(): Audio.play_music(_menu_music_after_credits)})
	Audio.play_music("credits")
var _menu_music_after_credits := "menu"

## M.settings: Geral, Vídeo, Áudio, Controlos, Acessibilidade, Memórias
func open_settings() -> void:
	var tabs := ["general", "video", "audio", "controls", "access", "data"]
	var labels: Array = []
	for k in tabs:
		labels.append(Data.t("set_" + k))
	var S := Settings
	var p := {}
	p = open({"title": Data.t("set_title"), "width": 640.0, "row": 38.0, "tabs": tabs, "tab_labels": labels,
		"foot": "Q / E  ·  LB / RB", "build": func(k: String) -> Array:
			var out: Array = []
			match k:
				"general":
					var lopts: Array = []
					for l in S.LANGS: lopts.append([l, S.LANG_NAMES[l]])
					out.append({"type": "choice", "label": Data.t("set_lang"), "opts": lopts, "get": func(): return S.get_v("lang"),
						"set": func(v): S.set_v("lang", v); _relabel(p, tabs)})
					out.append({"type": "choice", "label": Data.t("set_zoom"), "opts": [[1.0, Data.t("zoom_far")], [1.2, Data.t("zoom_normal")], [1.4, Data.t("zoom_near")], [1.6, Data.t("zoom_closest")]],
						"get": func(): return float(S.get_v("zoom")), "set": func(v): S.set_v("zoom", v)})
					out.append({"type": "slider", "label": Data.t("set_textspeed"), "min": 0.5, "max": 2.0, "step": 0.1, "get": func(): return float(S.get_v("text_speed")),
						"set": func(v): S.set_v("text_speed", v), "fmt": func(v): return "%.1f×" % v})
					out.append({"type": "toggle", "label": Data.t("set_timer"), "get": func(): return bool(S.get_v("show_timer")), "set": func(v): S.set_v("show_timer", v)})
				"video":
					out.append({"type": "choice", "label": Data.t("set_window"), "opts": [["fullscreen", Data.t("win_fullscreen")], ["borderless", Data.t("win_borderless")], ["windowed", Data.t("win_windowed")]],
						"get": func(): return String(S.get_v("window")), "set": func(v): S.set_v("window", v)})
					var ropts: Array = []
					for r in S.RESOLUTIONS: ropts.append(["%dx%d" % [r.x, r.y], "%d × %d" % [r.x, r.y]])
					out.append({"type": "choice", "label": Data.t("set_resolution"), "opts": ropts, "disabled": String(S.get_v("window")) != "windowed",
						"get": func(): var rr: Array = S.get_v("resolution"); return "%dx%d" % [int(rr[0]), int(rr[1])],
						"set": func(v): var pr: PackedStringArray = String(v).split("x"); S.set_v("resolution", [int(pr[0]), int(pr[1])])})
					out.append({"type": "toggle", "label": Data.t("set_vsync"), "get": func(): return bool(S.get_v("vsync")), "set": func(v): S.set_v("vsync", v)})
					out.append({"type": "choice", "label": Data.t("set_fpscap"), "opts": [[0, Data.t("fps_display")], [30, "30"], [60, "60"], [120, "120"], [144, "144"], [240, "240"]],
						"get": func(): return int(S.get_v("fps_cap")), "set": func(v): S.set_v("fps_cap", v)})
					out.append({"type": "toggle", "label": Data.t("set_showfps"), "get": func(): return bool(S.get_v("show_fps")), "set": func(v): S.set_v("show_fps", v)})
					out.append({"type": "slider", "label": Data.t("set_brightness"), "min": 0.6, "max": 1.4, "step": 0.05, "get": func(): return float(S.get_v("brightness")), "set": func(v): S.set_v("brightness", v)})
					out.append({"type": "toggle", "label": Data.t("set_particles"), "get": func(): return bool(S.get_v("particles")), "set": func(v): S.set_v("particles", v)})
					out.append({"type": "note", "label": Data.t("set_video_note_pc")})
				"audio":
					for pair in [["master", "set_master", ""], ["music", "set_music", "set_mute_music"], ["sfx", "set_sfx", "set_mute_sfx"], ["amb", "set_amb", "set_mute_amb"]]:
						var key: String = pair[0]
						out.append({"type": "slider", "label": Data.t(pair[1]), "min": 0.0, "max": 1.0, "step": 0.05,
							"get": func(): return float(S.s["vol"][key]), "set": func(v): S.s["vol"][key] = v; S.apply(); S.save()})
						if pair[2] != "":
							out.append({"type": "toggle", "label": Data.t(pair[2]), "get": func(): return bool(S.s["mute"][key]),
								"set": func(v): S.s["mute"][key] = v; S.apply(); S.save()})
				"controls":
					out.append({"type": "note", "label": Data.t("set_remap_note")})
					for a in S.REMAPPABLE:
						var act: String = a
						out.append({"type": "key", "label": Data.t("act_" + act) if Data.has_key("act_" + act) else act, "action": act,
							"value": func() -> String:
								var labs: Array = []
								for code in S.keys_for(act): labs.append(S.key_label(int(code)))
								return " / ".join(labs)})
					out.append({"label": Data.t("set_reset_keys"), "action": func(): S.reset_keys()})
					out.append({"type": "note", "label": Data.t("set_pad_layout_pc")})
				"access":
					out.append({"type": "slider", "label": Data.t("set_shake"), "min": 0.0, "max": 1.0, "step": 0.1, "get": func(): return float(S.get_v("shake")), "set": func(v): S.set_v("shake", v)})
					out.append({"type": "toggle", "label": Data.t("set_flashes"), "get": func(): return bool(S.get_v("flashes")), "set": func(v): S.set_v("flashes", v)})
					out.append({"type": "toggle", "label": Data.t("set_telegraphs"), "get": func(): return bool(S.get_v("telegraphs")), "set": func(v): S.set_v("telegraphs", v)})
					out.append({"type": "toggle", "label": Data.t("set_vibration"), "get": func(): return bool(S.get_v("vibration")), "set": func(v): S.set_v("vibration", v)})
				"data":
					out.append({"type": "note", "label": Data.t("set_data_note_pc")})
					out.append({"label": Data.t("set_open_folder"), "action": func(): OS.shell_open(ProjectSettings.globalize_path("user://"))})
			return out})

func _relabel(p: Dictionary, tabs: Array) -> void:
	p["title"] = Data.t("set_title")
	var labels: Array = []
	for k in tabs:
		labels.append(Data.t("set_" + k))
	p["tab_labels"] = labels

## M.pause
func open_pause(world) -> void:
	world.get_tree().paused = true
	var p := {}
	p = open({"title": Data.t("pause_title"), "width": 420.0, "items": [
		{"label": Data.t("pause_resume"), "action": func(): close(p)},
		{"label": Data.t("pause_settings"), "action": func(): open_settings()},
		{"label": Data.t("pause_quit"), "action": func(): confirm(Data.t("confirm_quit"), func():
			GameState.save(); close_all(); world.get_tree().paused = false; world.quit_to_menu.emit())},
	], "foot": Data.t("pause_info", {"time": _fmt_time(GameState.play_time), "pct": GameState.completion(), "deaths": GameState.deaths}),
		"on_close": func(): world.get_tree().paused = false})
