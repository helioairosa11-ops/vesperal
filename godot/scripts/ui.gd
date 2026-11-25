extends CanvasLayer
## Interface do jogo com a arte das referências (tools/art/ui_src → art/ui): moldura das velas para os menus,
## placas (btn/btn_focus) para as linhas, caixa larga para avisos e diálogos, inventário em pergaminho queimado.
## Todos os painéis têm o botão X para fechar. Teclado, rato e comando. Medidas em px de um ecrã de 900 de altura.

signal closed_all

var stack: Array = []          # painéis abertos (o último está à frente)
var c: Control
var f_title: FontVariation     # Cinzel, títulos
var f_label: Font              # Alegreya SC, botões, separadores, rótulos
var f_body: Font               # Alegreya, textos
var f_ital: Font               # Alegreya itálico, narração e notas
var f_bold: Font
var glow: Texture2D
var t := 0.0
var rebinding := ""            # ação à espera de uma tecla nova
var _rects: Array = []         # [{r, i}] linhas clicáveis do painel da frente
var _tab_rects: Array = []
var _close_r := Rect2()
var _hover_close := false
var _drag := -1

const INK := Color("#eadfcb")
const INK_DIM := Color("#a89a8a")
const EMBER := Color("#ffb45a")
const GOLD := Color("#d6b278")
const TITLE := Color("#f6e6c6")

# cortes das imagens (colunas/linhas alternam fixo / esticado, a começar por fixo)
const FR_X := [0, 150, 270, 625, 743, 893]
const FR_Y := [0, 330, 1080, 1274]
const BOX_X := [0, 190, 400, 493, 703, 893]
const BOX_Y := [0, 180, 348, 528]
const BTN_X := [0, 74, 611, 685]
const BTN_Y := [0, 0, 105, 105]
const SLOT_X := [0, 36, 92, 128]
const SLOT_Y := [0, 36, 92, 128]
# velas da moldura (px da imagem): a chama tremeluz por cima
const CANDLES := [Vector2(35, 22), Vector2(79, 40), Vector2(-73, 40), Vector2(-31, 22)]

func _ready() -> void:
	layer = 30
	process_mode = Node.PROCESS_MODE_ALWAYS
	c = Control.new()
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	add_child(c)
	c.draw.connect(_draw_ui)
	c.gui_input.connect(_gui)
	f_title = FontVariation.new(); f_title.base_font = load("res://art/fonts/Cinzel-VF.woff")
	f_title.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): 700}
	f_label = load("res://art/fonts/AlegreyaSC-Bold.woff2")
	f_body = load("res://art/fonts/Alegreya-Medium.woff2")
	f_ital = load("res://art/fonts/Alegreya-MediumItalic.woff2")
	f_bold = load("res://art/fonts/Alegreya-Bold.woff2")
	var g := Gradient.new()
	g.offsets = PackedFloat32Array([0.0, 1.0]); g.colors = PackedColorArray([Color(1, 1, 1, 1), Color(1, 1, 1, 0)])
	var gt := GradientTexture2D.new()
	gt.gradient = g; gt.fill = GradientTexture2D.FILL_RADIAL; gt.width = 64; gt.height = 64
	gt.fill_from = Vector2(0.5, 0.5); gt.fill_to = Vector2(1, 0.5)
	glow = gt

func tex(n: String) -> Texture2D:
	return Data.tex("res://art/ui/%s.png" % n)

# ================================================================== peças de desenho (também usadas pelo HUD)
## nove-fatias genérica: as colunas/linhas pares ficam à escala k, as ímpares esticam
func nine(ci: CanvasItem, tx: Texture2D, r: Rect2, k: float, xs: Array, ys: Array, mod := Color.WHITE) -> void:
	var dx := _segs(xs, r.size.x, k)
	var dy := _segs(ys, r.size.y, k)
	var y := r.position.y
	for j in ys.size() - 1:
		var x := r.position.x
		var sh: float = ys[j + 1] - ys[j]
		for i in xs.size() - 1:
			var sw: float = xs[i + 1] - xs[i]
			if dx[i] > 0.01 and dy[j] > 0.01 and sw > 0 and sh > 0:
				# meio píxel a mais para não se verem frestas entre as fatias
				ci.draw_texture_rect_region(tx, Rect2(x, y, dx[i] + 0.6, dy[j] + 0.6), Rect2(xs[i], ys[j], sw, sh), mod)
			x += dx[i]
		y += dy[j]

func _segs(b: Array, total: float, k: float) -> Array:
	var fixed := 0.0
	var st := 0.0
	for i in b.size() - 1:
		var w: float = b[i + 1] - b[i]
		if i % 2 == 0: fixed += w * k
		else: st += w
	var kk := k
	if fixed > total and fixed > 0:
		kk = k * total / fixed
		fixed = total
	var rem := maxf(0.0, total - fixed)
	var out: Array = []
	for i in b.size() - 1:
		var w2: float = b[i + 1] - b[i]
		out.append(w2 * kk if i % 2 == 0 else (rem * w2 / st if st > 0 else 0.0))
	return out

## moldura das velas (menus); k = escala da imagem
func frame(ci: CanvasItem, r: Rect2, k: float, a := 1.0) -> void:
	ci.draw_texture_rect(glow, r.grow(r.size.x * 0.18), false, Color(0, 0, 0, 0.55 * a))
	nine(ci, tex("frame"), r, k, FR_X, FR_Y, Color(1, 1, 1, a))
	# chamas das velas: halo que respira e um ponto quente a tremer
	for i in CANDLES.size():
		var cp: Vector2 = CANDLES[i]
		var p := Vector2(r.position.x + cp.x * k if cp.x > 0 else r.end.x + cp.x * k, r.position.y + cp.y * k)
		var fl := 0.75 + 0.25 * sin(t * 9.0 + i * 1.7) * sin(t * 3.1 + i)
		ci.draw_texture_rect(glow, Rect2(p - Vector2(34, 34) * k * 1.6, Vector2(68, 68) * k * 1.6), false, Color(1, 0.62, 0.25, 0.22 * fl * a))
		ci.draw_texture_rect(glow, Rect2(p - Vector2(9, 12) * k, Vector2(18, 24) * k), false, Color(1, 0.86, 0.55, 0.65 * fl * a))

## caixa larga (diálogo, confirmação, leitura, avisos)
func box(ci: CanvasItem, r: Rect2, k: float, a := 1.0) -> void:
	ci.draw_texture_rect(glow, r.grow(r.size.y * 0.25), false, Color(0, 0, 0, 0.5 * a))
	nine(ci, tex("box"), r, k, BOX_X, BOX_Y, Color(1, 1, 1, a))

## placa de botão/linha (btn.png); acesa quando escolhida
func plate(ci: CanvasItem, r: Rect2, focus: bool, a := 1.0) -> void:
	var k := r.size.y / 105.0
	nine(ci, tex("btn_focus" if focus else "btn"), r, k, BTN_X, BTN_Y, Color(1, 1, 1, a))
	if focus:
		# as duas brasas da referência à esquerda da placa
		var cy := r.position.y + r.size.y / 2.0
		var fl := 0.8 + 0.2 * sin(t * 7.0)
		for pt in [Vector2(r.position.x - 10.0 * k * 2.2, cy), Vector2(r.position.x + 26.0 * k * 2.2, cy)]:
			ci.draw_texture_rect(glow, Rect2(pt - Vector2(14, 14) * k * 2.2, Vector2(28, 28) * k * 2.2), false, Color(1, 0.6, 0.22, 0.55 * fl * a))
			ci.draw_circle(pt, 2.6 * k * 2.2, Color(1, 0.8, 0.45, a))

## casa (slot.png) e botão X
func slot(ci: CanvasItem, r: Rect2, focus: bool, a := 1.0) -> void:
	nine(ci, tex("slot_focus" if focus else "slot"), r, r.size.x / 128.0, SLOT_X, SLOT_Y, Color(1, 1, 1, a))

func close_btn(ci: CanvasItem, r: Rect2, hover: bool, a := 1.0) -> void:
	slot(ci, r, hover, a)
	var cc := r.get_center()
	var s := r.size.x * 0.2
	var w := maxf(2.0, r.size.x * 0.085)
	var col := Color(Color("#ffe2b0") if hover else Color("#d8c8b0"), a)
	for d in [Vector2(s, s), Vector2(s, -s)]:
		ci.draw_line(cc - d + Vector2(0, 1.5), cc + d + Vector2(0, 1.5), Color(0, 0, 0, 0.7 * a), w + 1.5)
		ci.draw_line(cc - d, cc + d, col, w)

## texto com sombra; al: 0 esquerda, 1 centro, 2 direita; ls: espaçamento entre letras (em fração do tamanho)
func text(ci: CanvasItem, f: Font, s: String, at: Vector2, fs: float, col: Color, al := 0, ls := 0.0, outline := 0.0) -> void:
	var isz := maxi(6, int(round(fs)))
	var w := text_w(f, s, fs, ls)
	var x := at.x - (w / 2.0 if al == 1 else (w if al == 2 else 0.0))
	var sh := Vector2(0, maxf(1.0, fs * 0.08))
	if ls <= 0.0:
		if outline > 0:
			ci.draw_string_outline(f, Vector2(x, at.y) + sh, s, HORIZONTAL_ALIGNMENT_LEFT, -1, isz, int(outline), Color(0, 0, 0, 0.6 * col.a))
		ci.draw_string(f, Vector2(x, at.y) + sh, s, HORIZONTAL_ALIGNMENT_LEFT, -1, isz, Color(0, 0, 0, 0.75 * col.a))
		ci.draw_string(f, Vector2(x, at.y), s, HORIZONTAL_ALIGNMENT_LEFT, -1, isz, col)
		return
	for ch in s:
		if outline > 0:
			ci.draw_string_outline(f, Vector2(x, at.y) + sh, ch, HORIZONTAL_ALIGNMENT_LEFT, -1, isz, int(outline), Color(0, 0, 0, 0.6 * col.a))
		ci.draw_string(f, Vector2(x, at.y) + sh, ch, HORIZONTAL_ALIGNMENT_LEFT, -1, isz, Color(0, 0, 0, 0.75 * col.a))
		ci.draw_string(f, Vector2(x, at.y), ch, HORIZONTAL_ALIGNMENT_LEFT, -1, isz, col)
		x += f.get_string_size(ch, HORIZONTAL_ALIGNMENT_LEFT, -1, isz).x + fs * ls

func text_w(f: Font, s: String, fs: float, ls := 0.0) -> float:
	var isz := maxi(6, int(round(fs)))
	if ls <= 0.0:
		return f.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, isz).x
	var w := 0.0
	for ch in s:
		w += f.get_string_size(ch, HORIZONTAL_ALIGNMENT_LEFT, -1, isz).x + fs * ls
	return w - fs * ls

## parágrafo com quebras; devolve a altura usada
func para(ci: CanvasItem, f: Font, s: String, at: Vector2, width: float, fs: float, col: Color, al := HORIZONTAL_ALIGNMENT_LEFT) -> float:
	var isz := maxi(6, int(round(fs)))
	var sh := Vector2(0, maxf(1.0, fs * 0.08))
	ci.draw_multiline_string(f, at + Vector2(0, fs) + sh, s, al, width, isz, -1, Color(0, 0, 0, 0.75 * col.a))
	ci.draw_multiline_string(f, at + Vector2(0, fs), s, al, width, isz, -1, col)
	return para_h(f, s, width, fs)

func para_h(f: Font, s: String, width: float, fs: float) -> float:
	return f.get_multiline_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, width, maxi(6, int(round(fs)))).y

## filete dourado com losango ao meio
func rule(ci: CanvasItem, cx: float, y: float, half: float, u: float, a := 1.0) -> void:
	var col := Color(GOLD, 0.55 * a)
	ci.draw_line(Vector2(cx - half, y), Vector2(cx - 9 * u, y), col, maxf(1.0, u))
	ci.draw_line(Vector2(cx + 9 * u, y), Vector2(cx + half, y), col, maxf(1.0, u))
	var d := 4.5 * u
	ci.draw_colored_polygon(PackedVector2Array([Vector2(cx, y - d), Vector2(cx + d, y), Vector2(cx, y + d), Vector2(cx - d, y)]), Color(GOLD, a))

## tira as marcas do texto rico do jogo web (*negrito*, _itálico_, [tecla])
func plain(s: String) -> String:
	return s.replace("**", "").replace("__", "")

# ================================================================== pilha de painéis
func is_open() -> bool:
	return not stack.is_empty()

func open(p: Dictionary) -> Dictionary:
	p.merge({"focus": 0, "tab": 0, "scroll": 0.0, "t": 0.0}, false)
	stack.append(p)
	c.mouse_filter = Control.MOUSE_FILTER_STOP
	Audio.sfx("ui_open")
	if p.get("kind", "") != "inv":
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
	# um Control dentro de um CanvasLayer não herda o tamanho do ecrã: sem isto o rato não lhe chega
	var vs := get_viewport().get_visible_rect().size
	if c.size != vs:
		c.position = Vector2.ZERO; c.size = vs
	if not stack.is_empty():
		stack.back()["t"] += delta
	c.queue_redraw()

# ------------------------------------------------------------------ itens do painel da frente
func _items(p: Dictionary) -> Array:
	if p.get("kind", "") == "inv":
		return p["entries"]
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
	if p.get("kind", "") == "inv":
		_inv_move(p, d * 5); return
	if p.get("kind", "") == "read":
		p["scroll"] = maxf(0.0, p["scroll"] + d * 48.0); p["wheel"] = true; return
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
	if p.get("kind", "") == "inv":
		_inv_move(p, d); return
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
			if p.get("row_buttons", false):
				_move(d)
			elif p.has("tabs"):
				_tab(d)

func _tab(d: int) -> void:
	var p: Dictionary = stack.back()
	if p.get("kind", "") == "inv":
		p["tab"] = posmod(p["tab"] + d, INV_TABS.size()); p["focus"] = 0; p["scroll"] = 0.0
		_inv_build(p); Audio.sfx("ui_tab"); return
	if not p.has("tabs"):
		return
	p["tab"] = posmod(p["tab"] + d, p["tabs"].size()); p["focus"] = 0; p["scroll"] = 0.0
	_skip_disabled(p, 1)
	Audio.sfx("ui_tab")

func _activate() -> void:
	var p: Dictionary = stack.back()
	var items := _items(p)
	if items.is_empty() or p["focus"] >= items.size():
		return
	var it: Dictionary = items[p["focus"]]
	if p.get("kind", "") == "inv":
		if it.has("act"):
			it["act"].call()
		return
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
	var nav := e.is_action("ui_left") or e.is_action("ui_right") or e.is_action("ui_up") or e.is_action("ui_down")
	if not e.is_pressed() or (e.is_echo() and not nav):
		return
	var p: Dictionary = stack.back()
	if e.is_action("ui_up"): _move(-1)
	elif e.is_action("ui_down"): _move(1)
	elif e.is_action("ui_left"): _adjust(-1)
	elif e.is_action("ui_right"): _adjust(1)
	elif e is InputEventKey and e.physical_keycode == KEY_Q: _tab(-1)
	elif e is InputEventKey and e.physical_keycode == KEY_E and (p.has("tabs") or p.get("kind", "") == "inv"): _tab(1)
	elif e is InputEventJoypadButton and e.button_index == JOY_BUTTON_LEFT_SHOULDER: _tab(-1)
	elif e is InputEventJoypadButton and e.button_index == JOY_BUTTON_RIGHT_SHOULDER: _tab(1)
	elif p.get("kind", "") == "read" and (e.is_action("ui_accept") or e.is_action("interact") or e.is_action("jump") or e.is_action("attack")): back()
	elif e.is_action("ui_accept") or e.is_action("jump") or e.is_action("attack"): _activate()
	elif e.is_action("ui_cancel") or e.is_action("pause") or e.is_action("dodge") or (p.get("kind", "") == "inv" and e.is_action("inventory")): back()
	else: return
	get_viewport().set_input_as_handled()

func _gui(e: InputEvent) -> void:
	if stack.is_empty():
		return
	var p: Dictionary = stack.back()
	if e is InputEventMouseMotion:
		_hover_close = _close_r.has_point(e.position)
		if _drag >= 0:
			_slide_to(e.position.x); return
		for r in _rects:
			if r["r"].has_point(e.position) and r["i"] != p["focus"]:
				var items := _items(p)
				if r["i"] < items.size() and (p.get("kind", "") == "inv" or _selectable(items[r["i"]])):
					p["focus"] = r["i"]; Audio.sfx("ui_move")
	elif e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT:
		if not e.pressed:
			_drag = -1; return
		if _close_r.has_point(e.position):
			back(); return
		for tab_r in _tab_rects:
			if tab_r["r"].has_point(e.position):
				if p.get("kind", "") == "inv":
					p["tab"] = tab_r["i"]; p["focus"] = 0; _inv_build(p)
				else:
					p["tab"] = tab_r["i"]; p["focus"] = 0; p["scroll"] = 0.0; _skip_disabled(p, 1)
				Audio.sfx("ui_tab"); return
		for r in _rects:
			if r["r"].has_point(e.position):
				p["focus"] = r["i"]
				var items := _items(p)
				if r["i"] >= items.size():
					return
				var it: Dictionary = items[r["i"]]
				if it.get("type", "") == "slider":
					_drag = r["i"]; _slide_to(e.position.x)
				elif it.get("type", "") == "choice":
					_adjust(-1 if e.position.x < r["r"].position.x + r["r"].size.x * 0.62 else 1)
				else:
					_activate()
				return
	elif e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_RIGHT and e.pressed:
		back()
	elif e is InputEventMouseButton and e.pressed and (e.button_index == MOUSE_BUTTON_WHEEL_DOWN or e.button_index == MOUSE_BUTTON_WHEEL_UP):
		p["scroll"] = maxf(0.0, p["scroll"] + (40.0 if e.button_index == MOUSE_BUTTON_WHEEL_DOWN else -40.0))
		p["wheel"] = true

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

# ================================================================== desenho dos painéis
func _draw_ui() -> void:
	_rects.clear(); _tab_rects.clear(); _slider_track.clear(); _close_r = Rect2()
	if stack.is_empty():
		return
	var vs := c.get_viewport_rect().size
	var u := vs.y / 900.0
	var p: Dictionary = stack.back()
	var a := minf(1.0, p["t"] / 0.18)
	# véu por tbrás: escurece e aquece o fundo
	c.draw_rect(Rect2(Vector2.ZERO, vs), Color(0.02, 0.012, 0.02, 0.62 * a))
	c.draw_texture_rect(glow, Rect2(vs.x * 0.1, vs.y * 0.2, vs.x * 0.8, vs.y), false, Color(0.35, 0.16, 0.08, 0.12 * a))
	match p.get("kind", "list"):
		"credits": _draw_credits(p, vs, u, a)
		"inv": _draw_inv(p, vs, u, a)
		"read": _draw_read(p, vs, u, a)
		_: _draw_list(p, vs, u, a)

func _close_at(r: Rect2, a: float) -> void:
	_close_r = r
	close_btn(c, r, _hover_close, a)

## painel de lista: moldura das velas (ou caixa larga) com placas
func _draw_list(p: Dictionary, vs: Vector2, u: float, a: float) -> void:
	var items := _items(p)
	var boxed: bool = p.get("skin", "frame") == "box"
	var k := (0.44 if boxed else 0.5) * u
	var w: float = maxf(p.get("width", 460.0) * u, (500.0 if boxed else 700.0) * k)
	var pad_x := (96.0 if boxed else 112.0) * k
	var top_c := (110.0 if boxed else 300.0) * k
	var bot_c := (100.0 if boxed else 190.0) * k
	var row_h: float = p.get("row", 52.0) * u
	var tabs_h := 54.0 * u if p.has("tabs") else 0.0
	var head_h := 0.0
	if boxed and String(p.get("title", "")) != "":
		head_h = 46.0 * u
	var inner_w := w - pad_x * 2.0
	var rows_h := 0.0
	if p.get("row_buttons", false):
		rows_h = 0.0
		var lines := 0.0
		for it in items:
			if it.get("type", "button") == "note": rows_h += _row_h(it, u, row_h, inner_w)
			else: lines = row_h
		rows_h += lines
	else:
		for it in items:
			rows_h += _row_h(it, u, row_h, inner_w)
	var foot_h := 40.0 * u if p.has("foot") else 0.0
	var h := minf(vs.y * 0.94, top_c + head_h + tabs_h + rows_h + foot_h + bot_c)
	var rise := (1.0 - a) * 18.0 * u
	var r := Rect2((vs.x - w) / 2.0, (vs.y - h) / 2.0 + rise, w, h)
	if boxed: box(c, r, k, a)
	else: frame(c, r, k, a)
	var cx := r.position.x + w / 2.0
	# título: na placa de cima da moldura, ou no topo da caixa
	if String(p.get("title", "")) != "":
		if boxed:
			text(c, f_title, String(p["title"]), Vector2(cx, r.position.y + top_c + 26.0 * u), 22.0 * u, Color(TITLE, a), 1, 0.08)
			rule(c, cx, r.position.y + top_c + 38.0 * u, 110.0 * u, u, a)
		else:
			var tfs := 26.0 * u
			while text_w(f_title, String(p["title"]), tfs, 0.1) > w - 330.0 * k and tfs > 14.0 * u:
				tfs -= 1.0
			text(c, f_title, String(p["title"]), Vector2(cx, r.position.y + 160.0 * k + tfs * 0.36), tfs, Color(TITLE, a), 1, 0.1)
	# X para fechar
	var xs := 34.0 * u
	if boxed:
		_close_at(Rect2(r.end.x - 70.0 * k - xs, r.position.y + 62.0 * k, xs, xs), a)
	else:
		_close_at(Rect2(r.end.x - 128.0 * k - xs, r.position.y + 160.0 * k - xs / 2.0, xs, xs), a)
	var y := r.position.y + top_c + head_h
	if p.has("tabs"):
		_draw_tabs(p, Rect2(r.position.x + pad_x, y, inner_w, tabs_h), u, a)
		y += tabs_h
	# linhas (deslocam-se quando não cabem)
	var area := Rect2(r.position.x, y, w, r.end.y - y - foot_h - bot_c)
	if p.get("row_buttons", false):
		var yy0 := y
		var btns: Array = []
		for i in items.size():
			var it: Dictionary = items[i]
			if it.get("type", "button") == "note":
				var hh := _row_h(it, u, row_h, inner_w)
				para(c, f_body, String(it["label"]), Vector2(r.position.x + pad_x, yy0 + 4.0 * u), inner_w, 18.0 * u, Color(INK, a), HORIZONTAL_ALIGNMENT_CENTER)
				yy0 += hh
			else:
				btns.append(i)
		var bw := (inner_w - 14.0 * u * (btns.size() - 1)) / maxf(1.0, btns.size())
		for j in btns.size():
			_draw_row(items[btns[j]], btns[j] == p["focus"], Rect2(r.position.x + pad_x + j * (bw + 14.0 * u), yy0 + 4.0 * u, bw, row_h - 8.0 * u), u, btns[j], a)
	else:
		var focus_y := 0.0
		var acc := 0.0
		for i in items.size():
			if i == p["focus"]:
				focus_y = acc
			acc += _row_h(items[i], u, row_h, inner_w)
		var sc: float = p["scroll"]
		if not p.get("wheel", false):
			if focus_y - sc > area.size.y - row_h * 1.5: sc = focus_y - area.size.y + row_h * 1.5
			if focus_y - sc < 0: sc = focus_y
		p["wheel"] = false
		sc = clampf(sc, 0.0, maxf(0.0, acc - area.size.y))
		p["scroll"] = sc
		var yy := y - sc
		for i in items.size():
			var it: Dictionary = items[i]
			var rh := _row_h(it, u, row_h, inner_w)
			if yy >= area.position.y - 2 and yy + rh <= area.end.y + 2:
				_draw_row(it, i == p["focus"], Rect2(r.position.x + pad_x, yy, inner_w, rh), u, i, a)
			yy += rh
		# setas quando há mais para cima/baixo
		if sc > 1:
			text(c, f_label, "▲", Vector2(cx, area.position.y + 2 * u), 12 * u, Color(EMBER, 0.7 * a), 1)
		if sc < acc - area.size.y - 1:
			text(c, f_label, "▼", Vector2(cx, area.end.y + 12 * u), 12 * u, Color(EMBER, 0.7 * a), 1)
	if p.has("foot"):
		text(c, f_ital, String(p["foot"]), Vector2(cx, r.end.y - bot_c - 8.0 * u), 16.0 * u, Color(INK_DIM, a), 1)

func _draw_tabs(p: Dictionary, r: Rect2, u: float, a: float) -> void:
	var labels: Array = p["tab_labels"]
	var fs := 15.0 * u
	var gap := 10.0 * u
	var tw := 0.0
	while true:
		tw = 0.0
		for l in labels:
			tw += text_w(f_label, String(l), fs, 0.04) + 26.0 * u + gap
		tw -= gap
		if tw <= r.size.x - 56.0 * u or fs <= 11.0 * u:
			break
		fs -= 0.5 * u
	var x := r.position.x + (r.size.x - tw) / 2.0
	var cy := r.position.y + r.size.y * 0.42
	# pistas Q / E nos lados
	text(c, f_label, "Q", Vector2(r.position.x + 6 * u, cy + 5 * u), 13 * u, Color(INK_DIM, 0.8 * a), 0)
	text(c, f_label, "E", Vector2(r.end.x - 6 * u, cy + 5 * u), 13 * u, Color(INK_DIM, 0.8 * a), 2)
	for i in labels.size():
		var lw := text_w(f_label, String(labels[i]), fs, 0.04) + 26.0 * u
		var act: bool = i == p["tab"]
		var tbr := Rect2(x, cy - 17 * u, lw, 34 * u)
		if act:
			plate(c, tbr, true, a)
		text(c, f_label, String(labels[i]), Vector2(x + lw / 2.0, cy + fs * 0.34), fs, Color(Color("#fff2da") if act else INK_DIM, a), 1, 0.04)
		_tab_rects.append({"r": tbr, "i": i})
		x += lw + gap
	rule(c, r.position.x + r.size.x / 2.0, r.end.y - 6 * u, r.size.x / 2.0, u, a * 0.7)

func _row_h(it: Dictionary, u: float, row_h: float, w: float) -> float:
	match it.get("type", "button"):
		"note":
			return para_h(f_ital, String(it["label"]), w - 24 * u, 16 * u) + 14 * u
		"header":
			return 38 * u
		"slot":
			return 88 * u
	return row_h

func _draw_row(it: Dictionary, foc: bool, r: Rect2, u: float, i: int, a: float) -> void:
	var tp: String = it.get("type", "button")
	var dis: bool = it.get("disabled", false)
	var al := a * (0.4 if dis else 1.0)
	if tp == "note":
		para(c, f_ital, String(it["label"]), r.position + Vector2(12 * u, 4 * u), r.size.x - 24 * u, 16 * u, Color(INK_DIM, a), it.get("align", HORIZONTAL_ALIGNMENT_LEFT))
		return
	if tp == "header":
		text(c, f_label, String(it["label"]), Vector2(r.position.x + r.size.x / 2.0, r.position.y + 25 * u), 16 * u, Color(EMBER, a), 1, 0.12)
		return
	_rects.append({"r": r, "i": i})
	var pr := Rect2(r.position.x, r.position.y + 3 * u, r.size.x, r.size.y - 6 * u)
	var lit := foc and not dis
	plate(c, pr, lit, al)
	var cy := pr.position.y + pr.size.y / 2.0
	if tp == "slot":
		text(c, f_title, str(it["n"]), Vector2(pr.position.x + 78 * u, cy + 14 * u), 38 * u, Color(EMBER, al), 1)
		if it.get("empty", false):
			text(c, f_ital, String(it["label"]), Vector2(pr.position.x + 120 * u, cy + 7 * u), 20 * u, Color(INK_DIM, al))
		else:
			text(c, f_label, String(it["label"]), Vector2(pr.position.x + 120 * u, cy - 5 * u), 22 * u, Color(Color("#fff3dc") if lit else INK, al), 0, 0.03)
			text(c, f_body, String(it["info"]), Vector2(pr.position.x + 120 * u, cy + 21 * u), 17 * u, Color(Color("#e2d2bc") if lit else INK_DIM, al))
		return
	var fs := 19.0 * u
	var tc := Color(Color("#fff3dc") if lit else INK, al)
	if tp == "button":
		text(c, f_label, String(it["label"]), Vector2(pr.position.x + pr.size.x / 2.0, cy + fs * 0.34), fs, tc, 1, 0.05)
		return
	# linhas de definição: rótulo à esquerda, valor à direita, dentro da placa
	var lx := pr.position.x + 34 * u
	var rx := pr.end.x - 34 * u
	text(c, f_label, String(it["label"]), Vector2(lx, cy + fs * 0.3), 17 * u, tc, 0, 0.03)
	var vc := Color(EMBER if lit else Color("#e7c391"), al)
	match tp:
		"toggle":
			var on: bool = it["get"].call()
			# interruptor: caixinha com brasa acesa quando ligado
			var bx := Rect2(rx - 22 * u, cy - 11 * u, 22 * u, 22 * u)
			c.draw_rect(bx, Color(0.05, 0.03, 0.05, 0.9 * al))
			c.draw_rect(bx, Color(GOLD, 0.7 * al), false, maxf(1.0, u * 1.2))
			if on:
				c.draw_texture_rect(glow, bx.grow(8 * u), false, Color(1, 0.55, 0.2, 0.6 * al))
				var d := 6.0 * u
				var bc := bx.get_center()
				c.draw_colored_polygon(PackedVector2Array([bc + Vector2(0, -d), bc + Vector2(d, 0), bc + Vector2(0, d), bc + Vector2(-d, 0)]), Color(Color("#ffd08a"), al))
			text(c, f_label, Data.t("on") if on else Data.t("off"), Vector2(rx - 32 * u, cy + 5.5 * u), 15 * u, vc, 2)
		"choice":
			var cur = it["get"].call()
			var lab := ""
			for o in it["opts"]:
				if o[0] == cur: lab = String(o[1])
			var lw := text_w(f_label, lab, 16 * u)
			text(c, f_label, lab, Vector2(rx - 20 * u, cy + 5.5 * u), 16 * u, vc, 2)
			var ac := Color(EMBER, al * (1.0 if lit else 0.45))
			_arrow(Vector2(rx - 34 * u - lw, cy), -1, u, ac)
			_arrow(Vector2(rx - 6 * u, cy), 1, u, ac)
		"key":
			var lab2: String = Data.t("set_press_key") if rebinding == it["action"] else it["value"].call()
			var kw := text_w(f_label, lab2, 15 * u) + 18 * u
			var kr := Rect2(rx - kw, cy - 13 * u, kw, 26 * u)
			c.draw_rect(kr, Color(0.06, 0.04, 0.06, 0.9 * al))
			c.draw_rect(kr, Color(GOLD if rebinding != it["action"] else EMBER, 0.75 * al), false, maxf(1.0, u * 1.2))
			text(c, f_label, lab2, Vector2(kr.get_center().x, cy + 5.5 * u), 15 * u, vc, 1)
		"slider":
			var v: float = it["get"].call()
			var kk := inverse_lerp(it.get("min", 0.0), it.get("max", 1.0), v)
			var tw := minf(190.0 * u, pr.size.x * 0.34)
			var trk := Rect2(rx - tw - 62 * u, cy - 4 * u, tw, 8 * u)
			_slider_track[i] = Rect2(trk.position.x, r.position.y, trk.size.x, r.size.y)
			# sulco escuro, filete dourado e brasa a encher
			c.draw_rect(trk.grow(2 * u), Color(0.03, 0.02, 0.03, 0.95 * al))
			c.draw_rect(trk.grow(2 * u), Color(GOLD, 0.45 * al), false, maxf(1.0, u))
			var fill := Rect2(trk.position, Vector2(tw * kk, trk.size.y))
			c.draw_polygon(PackedVector2Array([fill.position, fill.position + Vector2(fill.size.x, 0), fill.end, fill.position + Vector2(0, fill.size.y)]),
				PackedColorArray([Color(0.55, 0.18, 0.06, al), Color(1, 0.62, 0.25, al), Color(0.9, 0.42, 0.12, al), Color(0.4, 0.12, 0.04, al)]))
			var kp := Vector2(trk.position.x + tw * kk, cy)
			c.draw_texture_rect(glow, Rect2(kp - Vector2(12, 12) * u, Vector2(24, 24) * u), false, Color(1, 0.6, 0.25, (0.8 if lit else 0.4) * al))
			var d2 := 7.0 * u
			c.draw_colored_polygon(PackedVector2Array([kp + Vector2(0, -d2), kp + Vector2(d2, 0), kp + Vector2(0, d2), kp + Vector2(-d2, 0)]), Color(Color("#ffd7a0") if lit else Color("#d6a86a"), al))
			var txt: String = it["fmt"].call(v) if it.has("fmt") else str(roundi(v * 100)) + "%"
			text(c, f_label, txt, Vector2(rx, cy + 5.5 * u), 15 * u, vc, 2)

func _arrow(at: Vector2, d: int, u: float, col: Color) -> void:
	var s := 5.0 * u
	c.draw_colored_polygon(PackedVector2Array([at + Vector2(d * s, 0), at + Vector2(-d * s * 0.6, -s), at + Vector2(-d * s * 0.6, s)]), col)

func _draw_credits(_p: Dictionary, vs: Vector2, u: float, a: float) -> void:
	var k := 0.5 * u
	var w := minf(vs.x * 0.92, 720 * u)
	var h := minf(vs.y * 0.96, 880 * u)
	var r := Rect2((vs.x - w) / 2.0, (vs.y - h) / 2.0 + (1.0 - a) * 18.0 * u, w, h)
	frame(c, r, k, a)
	var cx := vs.x / 2.0
	text(c, f_title, "VESPERAL", Vector2(cx, r.position.y + 160.0 * k + 10 * u), 30 * u, Color(TITLE, a), 1, 0.22)
	_close_at(Rect2(r.end.x - 128.0 * k - 34 * u, r.position.y + 160.0 * k - 17 * u, 34 * u, 34 * u), a)
	var y := r.position.y + 300.0 * k
	text(c, f_ital, Data.t("subtitle"), Vector2(cx, y + 18 * u), 20 * u, Color(INK, a), 1)
	y += 38 * u
	var sections := [["cr_by", "Lourence Manuel"], ["cr_art_title", Data.t("cr_art")], ["cr_music_title", Data.t("cr_music")],
		["cr_engine_title", Data.t("cr_engine")], ["cr_langs_title", "English · Português · Español · Français"], ["cr_thanks_title", Data.t("cr_thanks")]]
	var inner := w - 260.0 * k
	for sct in sections:
		text(c, f_label, Data.t(sct[0]), Vector2(cx, y + 18 * u), 17 * u, Color(EMBER, a), 1, 0.12)
		y += 24 * u
		y += para(c, f_body, String(sct[1]), Vector2(cx - inner / 2.0, y), inner, 18 * u, Color(INK, a), HORIZONTAL_ALIGNMENT_CENTER) + 16 * u
	var br := Rect2(cx - 110 * u, r.end.y - 190.0 * k - 50 * u, 220 * u, 48 * u)
	_rects.append({"r": br, "i": 0})
	plate(c, br.grow_individual(0, -3 * u, 0, -3 * u), true, a)
	text(c, f_label, Data.t("back"), Vector2(cx, br.get_center().y + 6.5 * u), 19 * u, Color("#fff3dc", a), 1, 0.05)

# ================================================================== ecrãs
func confirm(msg: String, yes: Callable) -> void:
	var p := {}
	p = open({"skin": "box", "width": 560.0, "row_buttons": true, "row": 56.0, "items": [
		{"type": "note", "label": msg},
		{"label": Data.t("yes"), "action": func(): close(p); yes.call()},
		{"label": Data.t("no"), "action": func(): close(p)},
	]})

func _fmt_time(sec: float) -> String:
	var s := int(sec)
	return "%d:%02d:%02d" % [floori(s / 3600.0), floori(s / 60.0) % 60, s % 60]

## M.slots: tbrês memórias
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
	open({"title": Data.t("slots_title"), "width": 600.0, "items": items})

func _slot_actions(i: int, on_play: Callable) -> void:
	var p := {}
	p = open({"title": Data.t("slot_n", {"n": i + 1}), "width": 480.0, "items": [
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
	p = open({"title": Data.t("set_title"), "width": 780.0, "row": 54.0, "tabs": tabs, "tab_labels": labels,
		"build": func(k: String) -> Array:
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
	p = open({"title": Data.t("pause_title"), "width": 470.0, "row": 58.0, "items": [
		{"label": Data.t("pause_resume"), "action": func(): close(p)},
		{"label": Data.t("pause_inventory"), "action": func(): open_inventory(world)},
		{"label": Data.t("pause_settings"), "action": func(): open_settings()},
		{"label": Data.t("pause_quit"), "action": func(): confirm(Data.t("confirm_quit"), func():
			GameState.save(); close_all(); world.get_tree().paused = false; world.quit_to_menu.emit())},
	], "foot": Data.t("pause_info", {"time": _fmt_time(GameState.play_time), "pct": GameState.completion(), "deaths": GameState.deaths}),
		"on_close": func(): world.get_tree().paused = false})

# ================================================================== inventário (M.inventory do jogo web, arte de IMG_3485)
const INV_TABS := ["weapons", "relics", "consumables", "key", "quest"]
const INV_TAB_ICON := {"weapons": "w_desperto", "relics": "r_lantern", "consumables": "salt", "key": "letter_3", "quest": "lost_bell"}

func open_inventory(world, tab := "weapons") -> void:
	if world != null:
		world.get_tree().paused = true
	var p := {}
	p = open({"kind": "inv", "tab": maxi(0, INV_TABS.find(tab)), "world": world, "entries": [],
		"on_close": func(): if world != null and stack.is_empty(): world.get_tree().paused = false})
	_inv_build(p)

func _inv_build(p: Dictionary) -> void:
	var k: String = INV_TABS[p["tab"]]
	var st := GameState
	var out: Array = []
	match k:
		"weapons":
			for wid in st.weapons:
				var w: String = wid
				var e := {"id": "w_" + w, "equipped": st.weapon_id == w}
				# só a Lâmina do Despertar tem animações no Godot por agora: as outras ficam para ver
				if w == "desperto" and st.weapon_id != w:
					e["act"] = func(): st.weapon_id = w; Audio.sfx("equip"); _inv_build(p)
				out.append(e)
			if st.abilities.get("spell", false):
				out.append({"id": "ab_spell"})
			out.append({"id": "flask", "name": Data.t("flask_name", {"n": st.max_flasks}), "desc": Data.t("flask_desc"), "count": st.flasks})
		"relics":
			for rid in st.relics:
				var r2: String = rid
				out.append({"id": r2, "equipped": st.equipped.has(r2), "act": func():
					if st.equipped.has(r2):
						st.unequip(r2)
					elif not st.equip(r2):
						_inv_msg(p, Data.t("msg_no_slots")); Audio.sfx("ui_back"); return
					Audio.sfx("ui_ok"); _inv_build(p)})
		"consumables":
			for id in st.items:
				if String(Data.items.get(id, {}).get("cat", "")) == "consumable":
					var cid: String = id
					out.append({"id": cid, "count": st.count(cid), "act": func(): _use(p, cid)})
		"key":
			for pair in [["dash", "ab_dash"], ["spell", "ab_spell"], ["wall", "ab_wall"], ["double", "ab_double"]]:
				if st.abilities.get(pair[0], false):
					out.append({"id": pair[1]})
			for id in st.items:
				var it: Dictionary = Data.items.get(id, {})
				if String(it.get("cat", "")) == "key":
					var kid: String = id
					var e2 := {"id": kid}
					if it.has("letter"):
						e2["act"] = func(): _read_letter(p, kid)
					out.append(e2)
			if st.count("ash_steel") > 0:
				out.append({"id": "ash_steel", "count": st.count("ash_steel")})
		"quest":
			for id in st.items:
				if String(Data.items.get(id, {}).get("cat", "")) == "quest":
					out.append({"id": id, "count": st.count(id) if st.count(id) > 1 else 0})
	p["entries"] = out
	p["focus"] = clampi(p["focus"], 0, maxi(0, out.size() - 1))

func _inv_move(p: Dictionary, d: int) -> void:
	var n: int = p["entries"].size()
	if n == 0:
		return
	var nf: int = p["focus"] + d
	if absi(d) == 1:
		nf = posmod(nf, n)
	elif nf < 0 or nf >= n:
		return
	p["focus"] = nf
	Audio.sfx("ui_move")

func _inv_msg(p: Dictionary, s: String) -> void:
	p["msg"] = s; p["msg_t"] = 2.5

func _use(p: Dictionary, id: String) -> void:
	var st := GameState
	var w = p.get("world")
	match id:
		"salt":
			if w == null or w.player == null:
				return
			if w.player.hp >= w.player.max_hp:
				_inv_msg(p, Data.t("msg_full_hp")); return
			w.player.hp = minf(w.player.max_hp, w.player.hp + 40); st.hp = int(w.player.hp)
			Audio.sfx("heal")
		_:
			return
	st.take(id)
	_inv_msg(p, Data.t("msg_used", {"item": Data.t("item_%s_name" % id)}))
	_inv_build(p)

func _read_letter(p: Dictionary, id: String) -> void:
	var w = p.get("world")
	var n := String(Data.items[id].get("letter", ""))
	if w != null:
		close_all()
		w.hud.read(Data.t("item_%s_name" % id), Data.t("letter_%s_text" % n), true)

func _inv_name(e: Dictionary) -> String:
	return String(e["name"]) if e.has("name") else Data.t("item_%s_name" % e["id"])

func _inv_desc(e: Dictionary) -> String:
	return String(e["desc"]) if e.has("desc") else plain(Data.t("item_%s_desc" % e["id"]))

func _draw_inv(p: Dictionary, vs: Vector2, u: float, a: float) -> void:
	var W := minf(vs.x * 0.96, 1300.0 * u)
	var H := W * 719.0 / 1288.0
	if H > vs.y * 0.94:
		H = vs.y * 0.94; W = H * 1288.0 / 719.0
	var r := Rect2((vs.x - W) / 2.0, (vs.y - H) / 2.0 + (1.0 - a) * 18.0 * u, W, H)
	var X := func(fx: float) -> float: return r.position.x + fx / 2000.0 * W
	var Y := func(fy: float) -> float: return r.position.y + fy / 1116.0 * H
	var s := W / 2000.0                     # px da referência → ecrã
	c.draw_texture_rect(glow, r.grow(W * 0.12), false, Color(0, 0, 0, 0.55 * a))
	c.draw_texture_rect(tex("panel_inv"), r, false, Color(1, 1, 1, a))
	# ---- separadores em arco
	for i in INV_TABS.size():
		var act: bool = i == p["tab"]
		var tbr := Rect2(X.call(178.0 + i * 175.0), Y.call(72.0), 132.0 * s, 152.0 * s)
		c.draw_texture_rect(tex("tab_on" if act else "tab_off"), tbr, false, Color(1, 1, 1, a))
		var ic := Data.icon(INV_TAB_ICON[INV_TABS[i]])
		if ic:
			var isz := 62.0 * s
			var ir := Rect2(tbr.get_center().x - isz / 2.0, tbr.position.y + tbr.size.y * 0.5, isz, isz)
			c.draw_texture_rect(ic, ir, false, Color(1, 1, 1, (0.95 if act else 0.4) * a))
		_tab_rects.append({"r": tbr, "i": i})
	var tab_name := Data.t("inv_" + String(INV_TABS[p["tab"]]))
	text(c, f_label, "Q", Vector2(X.call(140.0), Y.call(162.0)), 15 * u, Color(INK_DIM, a), 1)
	text(c, f_label, "E", Vector2(X.call(1062.0), Y.call(162.0)), 15 * u, Color(INK_DIM, a), 1)
	text(c, f_label, tab_name, Vector2(X.call(575.0), Y.call(262.0)), 19 * u, Color(EMBER, a), 1, 0.1)
	# ---- grelha 5 × 4
	var entries: Array = p["entries"]
	var cell := 155.0 * s
	var step := 183.0 * s
	var rows := maxi(4, ceili(entries.size() / 5.0))
	var first_row := maxi(0, floori(int(p["focus"]) / 5.0) - 3)
	for j in 4:
		for i in 5:
			var idx := (first_row + j) * 5 + i
			var cr := Rect2(X.call(130.0) + i * step, Y.call(283.0) + j * step, cell, cell)
			var foc: bool = idx == p["focus"] and idx < entries.size()
			slot(c, cr, foc, a)
			if idx < entries.size():
				var e: Dictionary = entries[idx]
				_rects.append({"r": cr, "i": idx})
				if foc:
					c.draw_texture_rect(glow, cr.grow(cell * 0.2), false, Color(1, 0.6, 0.25, 0.16 * a))
				var ic2 := Data.icon(String(e["id"]))
				if ic2:
					var m := cell * 0.17
					c.draw_texture_rect(ic2, cr.grow(-m), false, Color(1, 1, 1, a))
				if int(e.get("count", 0)) > 1 or (e["id"] == "flask"):
					text(c, f_title, str(int(e.get("count", 0))), Vector2(cr.end.x - 14 * s, cr.end.y - 12 * s), 17 * u, Color("#f6e6c6", a), 2, 0.0, 3)
				if e.get("equipped", false):
					var dc := cr.position + Vector2(24, 24) * s
					var d := 7.0 * u
					c.draw_texture_rect(glow, Rect2(dc - Vector2(12, 12) * u, Vector2(24, 24) * u), false, Color(1, 0.6, 0.25, 0.8 * a))
					c.draw_colored_polygon(PackedVector2Array([dc + Vector2(0, -d), dc + Vector2(d, 0), dc + Vector2(0, d), dc + Vector2(-d, 0)]), Color(EMBER, a))
	if rows > 4:
		text(c, f_label, "▼" if first_row + 4 < rows else "▲", Vector2(X.call(575.0), Y.call(1050.0)), 14 * u, Color(EMBER, 0.7 * a), 1)
	# ---- coluna da direita: oval com o ícone, nome, descrição, relíquias equipadas
	var oval := Rect2(X.call(1412.0), Y.call(78.0), 296.0 * s, 425.0 * s)
	var sel: Dictionary = entries[p["focus"]] if p["focus"] < entries.size() else {}
	c.draw_texture_rect(tex("oval"), oval, false, Color(1, 1, 1, a))
	if not sel.is_empty():
		c.draw_texture_rect(glow, oval.grow(-oval.size.x * 0.12), false, Color(1, 0.62, 0.3, 0.2 * a))
		var ic3 := Data.icon(String(sel["id"]))
		if ic3:
			var isz2 := oval.size.x * 0.6
			c.draw_texture_rect(ic3, Rect2(oval.get_center() - Vector2(isz2, isz2) / 2.0, Vector2(isz2, isz2)), false, Color(1, 1, 1, a))
	var dx0: float = X.call(1240.0)
	var dw := 640.0 * s
	rule(c, X.call(1560.0), Y.call(522.0), 340.0 * s, u, a)
	var y: float = Y.call(560.0)
	if sel.is_empty():
		text(c, f_ital, Data.t("inv_empty"), Vector2(X.call(1560.0), y + 30 * u), 19 * u, Color(INK_DIM, a), 1)
	else:
		text(c, f_title, _inv_name(sel), Vector2(X.call(1560.0), y + 18 * u), 22 * u, Color(TITLE, a), 1, 0.04)
		y += 30 * u
		if sel.get("equipped", false):
			text(c, f_label, Data.t("equipped"), Vector2(X.call(1560.0), y + 12 * u), 14 * u, Color(EMBER, a), 1, 0.12)
			y += 20 * u
		var bottom: float = Y.call(842.0)
		var desc := _inv_desc(sel)
		var fs := 17.0 * u
		while para_h(f_body, desc, dw, fs) > bottom - y - 26 * u and fs > 12.0 * u:
			fs -= 0.5 * u
		para(c, f_body, desc, Vector2(dx0, y + 4 * u), dw, fs, Color(INK, a), HORIZONTAL_ALIGNMENT_CENTER)
		if sel.has("act"):
			text(c, f_ital, Data.t("inv_hint_unequip" if sel.get("equipped", false) else "inv_hint_use"), Vector2(X.call(1560.0), bottom), 15 * u, Color(INK_DIM, a), 1)
	# ranhuras de relíquia: anéis com as relíquias postas
	var n_rings := maxi(3, GameState.relic_slots)
	var ring_w := 122.0 * s
	var span := 470.0 * s
	text(c, f_label, Data.t("inv_relic_slots", {"n": GameState.equipped.size(), "m": GameState.relic_slots}), Vector2(X.call(1560.0), Y.call(878.0)), 14 * u, Color(INK_DIM, a), 1, 0.06)
	for i in n_rings:
		var rcx: float = X.call(1560.0) + (i - (n_rings - 1) / 2.0) * (span / maxf(1, n_rings - 1) if n_rings > 1 else 0.0)
		var rr := Rect2(rcx - ring_w / 2.0, Y.call(900.0), ring_w, ring_w * 200.0 / 180.0)
		var locked := i >= GameState.relic_slots
		c.draw_texture_rect(tex("ring"), rr, false, Color(1, 1, 1, (0.35 if locked else 1.0) * a))
		if i < GameState.equipped.size():
			var ic4 := Data.icon(String(GameState.equipped[i]))
			if ic4:
				var isz3 := ring_w * 0.6
				c.draw_texture_rect(ic4, Rect2(rr.get_center() - Vector2(isz3, isz3) / 2.0 + Vector2(0, 4 * s), Vector2(isz3, isz3)), false, Color(1, 1, 1, a))
	# aviso curto (sem ranhuras, usado…)
	if p.has("msg_t") and p["msg_t"] > 0:
		p["msg_t"] -= get_process_delta_time()
		var ma := clampf(p["msg_t"], 0, 1) * a
		text(c, f_body, String(p["msg"]), Vector2(X.call(575.0), Y.call(1052.0)), 17 * u, Color(Color("#ffd6a0"), ma), 1)
	_close_at(Rect2(X.call(1868.0) - 40 * u, Y.call(50.0), 40 * u, 40 * u), a)

# ================================================================== leitura (inscrições e cartas)
func open_read(tree: SceneTree, title: String, body: String, letter := false) -> void:
	if tree != null:
		tree.paused = true
	open({"kind": "read", "title": title, "body": plain(body), "letter": letter,
		"on_close": func(): if tree != null and stack.is_empty(): tree.paused = false})

func _draw_read(p: Dictionary, vs: Vector2, u: float, a: float) -> void:
	var letter: bool = p["letter"]
	var w := minf(vs.x * 0.9, (860.0 if letter else 760.0) * u)
	var k := 0.44 * u
	var pad := 92.0 * u
	var inner := w - pad * 2.0
	var f: Font = f_ital if letter else f_body
	var fs := 20.0 * u
	var body_h := para_h(f, String(p["body"]), inner, fs)
	var head := 84.0 * u
	var h := minf(vs.y * 0.9, head + body_h + 120.0 * u)
	var r := Rect2((vs.x - w) / 2.0, (vs.y - h) / 2.0 + (1.0 - a) * 18.0 * u, w, h)
	box(c, r, k, a)
	var cx := r.get_center().x
	text(c, f_title, String(p["title"]), Vector2(cx, r.position.y + 72.0 * u), 26 * u, Color(TITLE, a), 1, 0.06)
	rule(c, cx, r.position.y + 90.0 * u, 160 * u, u, a)
	_close_at(Rect2(r.end.x - 70.0 * k - 34 * u, r.position.y + 62.0 * k, 34 * u, 34 * u), a)
	var area := Rect2(r.position.x + pad, r.position.y + head + 26 * u, inner, h - head - 86 * u)
	var sc := clampf(float(p["scroll"]), 0.0, maxf(0.0, body_h - area.size.y))
	p["scroll"] = sc
	# o texto que sai da área desvanece: desenha-se linha a linha só o que cabe
	var tl := TextParagraph.new()
	tl.add_string(String(p["body"]), f, int(fs))
	tl.width = inner
	tl.alignment = HORIZONTAL_ALIGNMENT_LEFT
	var y := area.position.y - sc
	for i in tl.get_line_count():
		var lh := tl.get_line_size(i).y
		if y >= area.position.y - 1 and y + lh <= area.end.y + 1:
			tl.draw_line(c.get_canvas_item(), Vector2(area.position.x, y + 1.5 * u), i, Color(0, 0, 0, 0.7 * a))
			tl.draw_line(c.get_canvas_item(), Vector2(area.position.x, y), i, Color(Color("#efe3cf"), a))
		y += lh
	if body_h > area.size.y + 1:
		if sc > 1: text(c, f_label, "▲", Vector2(cx, area.position.y - 6 * u), 12 * u, Color(EMBER, 0.8 * a), 1)
		if sc < body_h - area.size.y - 1: text(c, f_label, "▼", Vector2(cx, area.end.y + 16 * u), 12 * u, Color(EMBER, 0.8 * a), 1)
