extends Control
## Menu principal igual ao do jogo web: fundo de App.drawMenuBg (js/main.js) e disposição de .mainmenu (css/game.css,
## regras finais): coluna centrada a 4% da esquerda com o V, VESPERAL em degradê, ornamento, subtítulo,
## opções em EB Garamond centradas (a escolhida acende-se com um ponto de brasa), assinatura e dica.
## As medidas estão em px de CSS para um ecrã de 900 de altura e escalam com a janela.

signal start_new(slot: int, fresh: bool)
signal continue_game

var t := 0.0
var art: Texture2D
var glow: Texture2D
var logo: Texture2D
var items: Array = []
var focus := 0
var f_title: FontVariation
var f_body: FontVariation
var panel := ""
var title_node: Control
var _rects: Array = []
var _title_at := Vector2.ZERO
var _title_fs := 0.0

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	_fit()
	get_viewport().size_changed.connect(_fit)
	art = load("res://art/bg/menu.jpg")
	logo = load("res://art/ui/logo_v.png")
	f_title = FontVariation.new(); f_title.base_font = load("res://art/fonts/Cinzel-VF.woff")
	f_title.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): 500}
	f_body = FontVariation.new(); f_body.base_font = load("res://art/fonts/EBGaramond-VF.woff")
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 1)); g.set_color(1, Color(1, 1, 1, 0))
	var gt := GradientTexture2D.new()
	gt.gradient = g; gt.fill = GradientTexture2D.FILL_RADIAL
	gt.fill_from = Vector2(0.5, 0.5); gt.fill_to = Vector2(1, 0.5); gt.width = 128; gt.height = 128
	glow = gt
	_build_items()
	Data.lang_changed.connect(_build_items)
	_make_title_node()
	Audio.play_music("menu")
	Audio.set_ambience("sanct")

func _build_items() -> void:
	items.clear()
	if GameState.has_save():
		items.append({"label": Data.t("mm_continue"), "cb": func(): continue_game.emit()})
	items.append({"label": Data.t("mm_play"), "cb": func(): UI.open_slots(func(i: int, fresh: bool): start_new.emit(i, fresh))})
	items.append({"label": Data.t("mm_settings"), "cb": func(): UI.open_settings()})
	items.append({"label": Data.t("mm_credits"), "cb": func(): UI.open_credits()})
	items.append({"label": Data.t("mm_quit"), "cb": func(): get_tree().quit()})
	focus = clampi(focus, 0, items.size() - 1)

func _fit() -> void:
	position = Vector2.ZERO
	size = get_viewport().get_visible_rect().size

func _process(delta: float) -> void:
	t += delta
	queue_redraw()
	title_node.queue_redraw()

# ------------------------------------------------------------------ entrada
func _gui_input(e: InputEvent) -> void:
	if UI.is_open():
		return
	if e is InputEventMouseMotion and panel == "":
		var i := _item_at(e.position)
		if i >= 0 and i != focus:
			focus = i; Audio.sfx("ui_move")
	elif e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		if panel != "":
			_close_panel(); return
		var i := _item_at(e.position)
		if i >= 0:
			_activate(i)

func _unhandled_input(e: InputEvent) -> void:
	if UI.is_open():
		return
	if not e.is_pressed() or e.is_echo():
		return
	if panel != "":
		if e.is_action("ui_cancel") or e.is_action("ui_accept") or e.is_action("jump") or e.is_action("attack") or e.is_action("pause"):
			_close_panel()
			get_viewport().set_input_as_handled()
		return
	if e.is_action("ui_down") or e.is_action("down"):
		focus = (focus + 1) % items.size(); Audio.sfx("ui_move")
	elif e.is_action("ui_up") or e.is_action("up"):
		focus = (focus - 1 + items.size()) % items.size(); Audio.sfx("ui_move")
	elif e.is_action("ui_accept") or e.is_action("jump") or e.is_action("attack"):
		_activate(focus)
	else:
		return
	get_viewport().set_input_as_handled()

func _close_panel() -> void:
	if panel == "credits":
		Audio.play_music("menu")
	panel = ""; Audio.sfx("ui_back")

func _activate(i: int) -> void:
	focus = i
	Audio.sfx("ui_ok")
	items[i]["cb"].call()

func _item_at(p: Vector2) -> int:
	for i in _rects.size():
		if _rects[i].has_point(p):
			return i
	return -1

# ------------------------------------------------------------------ desenho
func _draw() -> void:
	var W := size.x; var H := size.y
	if W < 2 or H < 2:
		return
	# fundo (App.drawMenuBg com a ilustração)
	var z := 1.04 + 0.02 * sin(t * 0.05)
	var k := maxf(W / art.get_width(), H / art.get_height()) * z
	var w := art.get_width() * k; var h := art.get_height() * k
	var x := (W - w) * 0.62; var y := (H - h) * 0.55
	draw_texture_rect(art, Rect2(x, y, w, h), false)
	var fx := Vector2(x + w * 0.637, y + h * 0.6)
	var fl := 0.5 + 0.12 * sin(t * 7.0) + 0.08 * sin(t * 13.1)
	_add_glow(fx, h * 0.3, Color("#ff8c3c"), fl * 0.55)
	var cw := W * 0.62
	_hgrad(Rect2(0, 0, cw * 0.65, H), Color(0.02, 0.016, 0.024, 0.72), Color(0.02, 0.016, 0.024, 0.3))
	_hgrad(Rect2(cw * 0.65, 0, cw * 0.35, H), Color(0.02, 0.016, 0.024, 0.3), Color(0.02, 0.016, 0.024, 0.0))
	if panel == "credits":
		_draw_credits(W, H); return
	if panel == "options":
		_draw_options(W, H); return
	_draw_menu(W, H)

func _draw_menu(W: float, H: float) -> void:
	var u := H / 900.0                     # 1 px de CSS
	var vw := W / u / 100.0
	var vh := 9.0
	var colw := minf(36.0 * vw, 460.0) * u
	var cx := W * 0.04 + colw / 2.0
	# medidas (px CSS)
	var lw := clampf(12.0 * vw, 70, 165)
	var lh := lw * (logo.get_height() / float(logo.get_width()))
	var lmb := clampf(1.2 * vh, 4, 12)
	var tfs := clampf(6.2 * vw, 36, 84)
	var orn_m1 := clampf(1.4 * vh, 6, 12)
	var orn_m2 := clampf(1.0 * vh, 4, 8)
	var sfs := clampf(1.7 * vw, 13, 22)
	var logo_mb := clampf(4.5 * vh, 12, 44)
	var bfs := clampf(2.3 * vw, 17, 30)
	var bpad := clampf(0.6 * vh, 2, 6)
	var gap := clampf(0.4 * vh, 0, 4)
	var bh := bfs * 1.35 + bpad * 2.0
	var cr_m := clampf(4.0 * vh, 14, 34)
	var total := lh + lmb + tfs * 1.05 + orn_m1 + 10 + orn_m2 + sfs * 1.3 + logo_mb \
		+ items.size() * bh + (items.size() - 1) * gap + cr_m + 14 + 6 + 16
	var y := (H - total * u) / 2.0
	# V com brilho a respirar (mmVGlow)
	var gk := 0.5 + 0.5 * sin(t * PI / 4.0)
	_add_glow(Vector2(cx, y + lh * u / 2.0), (lw * 0.5 + lerpf(14, 26, gk)) * u, Color(1, 0.67, 0.31), lerpf(0.2, 0.42, gk))
	draw_texture_rect(logo, Rect2(cx - lw * u / 2.0, y, lw * u, lh * u), false)
	y += (lh + lmb) * u
	# VESPERAL (o degradê é feito no nó do título; aqui só a sombra)
	var tw := _spaced_w(f_title, "VESPERAL", tfs * u, 0.12) - tfs * u * 0.12
	_title_at = Vector2(cx - tw / 2.0, y + tfs * 0.86 * u); _title_fs = tfs * u
	_add_glow(Vector2(cx, y + tfs * 0.5 * u), tw * 0.6, Color(1, 0.67, 0.35), 0.1)
	_spaced(f_title, "VESPERAL", _title_at + Vector2(0, 2 * u), tfs * u, Color(0, 0, 0, 1), 0.12)
	y += (tfs * 1.05 + orn_m1) * u
	# ornamento: — ◆ —
	var oy := y + 5 * u
	var half := colw / 2.0 - 15 * u
	_hline(Vector2(cx - 15 * u - half, oy), half, Color(0.84, 0.7, 0.47, 0.0), Color(0.84, 0.7, 0.47, 0.85), u)
	_hline(Vector2(cx + 15 * u, oy), half, Color(0.84, 0.7, 0.47, 0.85), Color(0.84, 0.7, 0.47, 0.0), u)
	var d := 7.0 * u
	_add_glow(Vector2(cx, oy), 12 * u, Color(1, 0.6, 0.27), 0.6)
	draw_colored_polygon(PackedVector2Array([Vector2(cx, oy - d), Vector2(cx + d, oy), Vector2(cx, oy + d), Vector2(cx - d, oy)]), Color("#a0602c"))
	draw_circle(Vector2(cx, oy), d * 0.42, Color("#ffd08a"))
	draw_polyline(PackedVector2Array([Vector2(cx, oy - d), Vector2(cx + d, oy), Vector2(cx, oy + d), Vector2(cx - d, oy), Vector2(cx, oy - d)]), Color("#d6b278"), maxf(1.0, u))
	y += (10 + orn_m2) * u
	# subtítulo
	var sub := Data.t("subtitle").to_upper()
	var sw := _spaced_w(f_title, sub, sfs * u, 0.18) - sfs * u * 0.18
	_spaced(f_title, sub, Vector2(cx - sw / 2.0, y + sfs * u), sfs * u, Color("#e4cfa8"), 0.18)
	y += (sfs * 1.3 + logo_mb) * u
	# opções
	_rects.clear()
	for i in items.size():
		var lab: String = items[i]["label"]
		var foc := i == focus
		var fs := bfs * u
		var lwid := f_body.get_string_size(lab, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs)).x
		var r := Rect2(cx - lwid / 2.0 - 26 * u, y, lwid + 52 * u, bh * u)
		_rects.append(r)
		var base := Vector2(cx - lwid / 2.0, y + (bpad + bfs * 1.0) * u)
		if foc:
			_add_glow(Vector2(cx, base.y - fs * 0.3), lwid * 0.55, Color(1, 0.67, 0.35), 0.22)
		draw_string(f_body, base + Vector2(0, 1 * u), lab, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs), Color(0, 0, 0, 0.9))
		draw_string(f_body, base, lab, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs), Color("#fff2dc") if foc else Color("#d9c8ad"))
		if foc:
			var ph := 0.5 + 0.5 * sin(t * TAU)       # mmFlame .5s alternate
			var dp := Vector2(r.end.x - 9 * u, y + bh * u / 2.0 - ph * u)
			_add_glow(dp, 11 * u, Color(1, 0.59, 0.24), 0.7)
			draw_set_transform(dp, 0, Vector2(lerpf(1, 0.9, ph), lerpf(1, 1.1, ph)))
			draw_circle(Vector2.ZERO, 3 * u, Color("#ffb050"))
			draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
		y += (bh + gap) * u
	y += (cr_m - gap) * u
	# assinatura e dica
	var cred := "LOURENCE MANUEL"
	var cfs := 11.0 * u
	var crw := _spaced_w(f_title, cred, cfs, 0.3) - cfs * 0.3
	_spaced(f_title, cred, Vector2(cx - crw / 2.0, y + 11 * u), cfs, Color(0.84, 0.7, 0.47, 0.6), 0.3)
	y += (14 + 6) * u
	var hint := Data.t("mm_hint")
	var hfs := 12.0 * u
	_center(f_body, hint, cx, y + 12 * u + 1, hfs, Color(0, 0, 0, 0.4))
	_center(f_body, hint, cx, y + 12 * u, hfs, Color(0.78, 0.75, 0.69, 0.5))

# ------------------------------------------------------------------ título em degradê (background-clip:text)
func _make_title_node() -> void:
	title_node = Control.new()
	title_node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sh := Shader.new()
	sh.code = """shader_type canvas_item;
uniform float top;
uniform float height;
varying float vy;
void vertex() { vy = VERTEX.y; }
void fragment() {
	float k = clamp((vy - top) / height, 0.0, 1.0);
	vec3 c0 = vec3(0.984, 0.937, 0.851);
	vec3 c1 = vec3(0.910, 0.812, 0.643);
	vec3 c2 = vec3(0.788, 0.635, 0.424);
	vec3 c = k < 0.55 ? mix(c0, c1, k / 0.55) : mix(c1, c2, (k - 0.55) / 0.45);
	COLOR = vec4(c, texture(TEXTURE, UV).a * COLOR.a);
}"""
	var m := ShaderMaterial.new(); m.shader = sh
	title_node.material = m
	title_node.draw.connect(_draw_title)
	add_child(title_node)

func _draw_title() -> void:
	if panel != "" or _title_fs <= 0:
		return
	var m: ShaderMaterial = title_node.material
	# a caixa da linha (line-height 1.05) define o degradê, como no CSS
	m.set_shader_parameter("top", _title_at.y - _title_fs * 0.86)
	m.set_shader_parameter("height", _title_fs * 1.05)
	var x := _title_at.x
	for ch in "VESPERAL":
		title_node.draw_string(f_title, Vector2(x, _title_at.y), ch, HORIZONTAL_ALIGNMENT_LEFT, -1, int(_title_fs), Color.WHITE)
		x += f_title.get_string_size(ch, HORIZONTAL_ALIGNMENT_LEFT, -1, int(_title_fs)).x + _title_fs * 0.12

# ------------------------------------------------------------------ ajudas
func _add_glow(c: Vector2, r: float, col: Color, a: float) -> void:
	draw_texture_rect(glow, Rect2(c - Vector2(r, r), Vector2(r, r) * 2.0), false, Color(col, a))

func _hgrad(r: Rect2, a: Color, b: Color) -> void:
	draw_polygon(PackedVector2Array([r.position, r.position + Vector2(r.size.x, 0), r.end, r.position + Vector2(0, r.size.y)]), PackedColorArray([a, b, b, a]))

func _hline(p: Vector2, w: float, a: Color, b: Color, u: float) -> void:
	_hgrad(Rect2(p - Vector2(0, maxf(1.0, u) / 2.0), Vector2(w, maxf(1.0, u))), a, b)

func _spaced_w(f: Font, s: String, fs: float, ls: float) -> float:
	var w := 0.0
	for ch in s:
		w += f.get_string_size(ch, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs)).x + fs * ls
	return w

func _spaced(f: Font, s: String, at: Vector2, fs: float, col: Color, ls: float) -> void:
	var x := at.x
	var shadow := col != Color(0, 0, 0, 1)
	for ch in s:
		if shadow:
			draw_string(f, Vector2(x, at.y + maxf(1.0, fs / 22.0)), ch, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs), Color(0, 0, 0, col.a * 0.8))
		draw_string(f, Vector2(x, at.y), ch, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs), col)
		x += f.get_string_size(ch, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs)).x + fs * ls

func _panel_box(W: float, H: float, w: float, h: float) -> Rect2:
	var r := Rect2((W - w) / 2.0, (H - h) / 2.0, w, h)
	draw_rect(r, Color(0.047, 0.04, 0.055, 0.94))
	draw_rect(r, Color(0.84, 0.7, 0.47, 0.35), false, 1.0)
	return r

func _center(f: Font, s: String, cx: float, y: float, fs: float, col: Color) -> void:
	var w := f.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs)).x
	draw_string(f, Vector2(cx - w / 2.0, y), s, HORIZONTAL_ALIGNMENT_LEFT, -1, int(fs), col)

func _draw_credits(W: float, H: float) -> void:
	var u := H / 900.0
	var r := _panel_box(W, H, 560 * u, 560 * u)
	var y := r.position.y + 80 * u
	var cx := W / 2.0
	var lines := [["VESPERAL", 40, f_title, Color("#f2dcae")], ["A Última Chama", 22, f_body, Color("#e9dfcf")], ["", 8, f_body, Color.WHITE],
		["UM JOGO DE", 14, f_title, Color("#a99f92")], ["Lourence Manuel", 22, f_body, Color("#e9dfcf")], ["", 8, f_body, Color.WHITE],
		["AGRADECIMENTOS", 14, f_title, Color("#a99f92")], ["A quem acordar.", 20, f_body, Color("#e9dfcf")]]
	for L in lines:
		_center(L[2], L[0], cx, y, L[1] * u, L[3])
		y += L[1] * 1.9 * u
	_center(f_title, Data.t("back"), cx, r.end.y - 40 * u, 18 * u, Color("#fff4dc"))

func _draw_options(W: float, H: float) -> void:
	var u := H / 900.0
	var r := _panel_box(W, H, 560 * u, 280 * u)
	_center(f_title, Data.t("mm_settings").to_upper(), W / 2.0, r.position.y + 60 * u, 24 * u, Color("#f3e7d3"))
	_center(f_body, "F11 — ecrã inteiro", W / 2.0, r.position.y + 130 * u, 20 * u, Color("#e9dfcf"))
	_center(f_title, Data.t("back"), W / 2.0, r.end.y - 40 * u, 18 * u, Color("#fff4dc"))
