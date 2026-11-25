extends CanvasLayer
## HUD com a arte do jogo web (assets/ui/hud_*): barra de vida com moldura, círios de cura, cinza, barra do chefe,
## avisos, nome da zona, inscrições. Desenhado em unidades lógicas 640×360 (como no jogo web).

var world
var boss = null
var prompt := ""
var flash := Color(0, 0, 0, 0)
var hurt := 0.0
var tint := Color(0, 0, 0, 0)
var vignette: Texture2D
var red_edges: Texture2D
var ghost := 100.0
var boss_ghost := 1.0
var toasts: Array = []
var banner_txt := ""
var banner_t := 0.0
var read_title := ""
var read_body := ""
var died_t := -1.0
var c: Control
var font_title: Font
var font_body: Font
var K := 1.0

func _ready() -> void:
	layer = 10
	c = Control.new()
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	c.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	add_child(c)
	c.draw.connect(_draw_hud)
	font_title = load("res://art/fonts/Cinzel-Bold.woff2")
	font_body = load("res://art/fonts/EBGaramond-Regular.woff2")
	# margens vermelhas da ferida (redEdges do jogo web)
	var g := Gradient.new()
	g.offsets = PackedFloat32Array([0.0, 0.265, 0.6, 1.0])
	g.colors = PackedColorArray([Color(0.47, 0, 0, 0), Color(0.47, 0, 0, 0), Color(0.59, 0.024, 0.04, 0.35), Color(0.75, 0.04, 0.08, 0.95)])
	var gt := GradientTexture2D.new()
	gt.gradient = g; gt.fill = GradientTexture2D.FILL_RADIAL; gt.width = 160; gt.height = 90
	gt.fill_from = Vector2(0.5, 0.5); gt.fill_to = Vector2(0.5 + 98.0 / 160.0, 0.5)
	red_edges = gt
	# G.vignette(0.55, tint): radial de 0.35·altura a 0.62·largura
	var vg := Gradient.new()
	vg.offsets = PackedFloat32Array([0.0, 1.0]); vg.colors = PackedColorArray([Color(0, 0, 0, 0), Color(0, 0, 0, 0.55)])
	var vt := GradientTexture2D.new()
	vt.gradient = vg; vt.fill = GradientTexture2D.FILL_RADIAL; vt.width = 160; vt.height = 90
	vt.fill_from = Vector2(0.5, 0.5); vt.fill_to = Vector2(0.5 + 0.62, 0.5)
	vignette = vt

func toast(s: String) -> void:
	if s == "":
		return
	toasts.append({"s": s, "t": 4.0})
	if toasts.size() > 3:
		toasts.pop_front()

func banner(s: String) -> void:
	banner_txt = s; banner_t = 3.2

func read(title: String, body: String) -> void:
	read_title = title; read_body = body

func died() -> void:
	died_t = 0.0

func _process(delta: float) -> void:
	for q in toasts:
		q["t"] -= delta
	toasts = toasts.filter(func(q): return q["t"] > 0)
	banner_t = maxf(0.0, banner_t - delta)
	if died_t >= 0:
		died_t += delta
		if died_t > 2.4:
			died_t = -1.0
	c.queue_redraw()

func _unhandled_input(e: InputEvent) -> void:
	if read_body != "" and e.is_pressed() and not e.is_echo():
		if e.is_action("interact") or e.is_action("ui_cancel") or e.is_action("jump") or e.is_action("attack"):
			read_body = ""; read_title = ""
			get_viewport().set_input_as_handled()

func _flame(at: Vector2, sc: float, tt: float, k: float) -> void:
	var f1 := sin(tt * 9.0) * 0.6 + sin(tt * 23.0) * 0.3
	var f2 := sin(tt * 13.0 + 1.0)
	for i in 4:
		c.draw_circle(at + Vector2(0, -2 * sc), 9.0 * sc * (1.0 - i * 0.22), Color(1, 0.6, 0.25, (0.35 + 0.25 * k) * 0.18))
	c.draw_colored_polygon(_flame_poly(at, sc, 2.4, 6.4 + f2 * 0.6, f1 * 0.6, 1.2), Color("#ff7a2a"))
	c.draw_colored_polygon(_flame_poly(at, sc, 1.2, 4.2 + f2 * 0.4, f1 * 0.3, 0.6), Color("#ffe0a0"))

func _flame_poly(at: Vector2, s: float, hw: float, h: float, tip: float, bot: float) -> PackedVector2Array:
	# curvas quadráticas da chama do HUD web, amostradas
	var pts := PackedVector2Array()
	var a0 := at + Vector2(-hw, 0) * s
	var t1 := at + Vector2(tip, -h) * s
	var a1 := at + Vector2(hw, 0) * s
	var q := func(p0: Vector2, c0: Vector2, p1: Vector2, u: float) -> Vector2: return p0.lerp(c0, u).lerp(c0.lerp(p1, u), u)
	for i in 8: pts.append(q.call(a0, at + Vector2(-hw * 1.17, -h * 0.47) * s, t1, i / 8.0))
	for i in 8: pts.append(q.call(t1, at + Vector2(hw * 1.17, -h * 0.47) * s, a1, i / 8.0))
	for i in 8: pts.append(q.call(a1, at + Vector2(0, bot) * s, a0, i / 8.0))
	return pts

func _img(n: String) -> Texture2D:
	return Data.tex("res://art/ui/%s.png" % n)

func _draw_hud() -> void:
	var vs := c.get_viewport_rect().size
	var k := vs.y / 360.0
	K = k
	var W := vs.x / k
	c.draw_set_transform(Vector2.ZERO, 0, Vector2(k, k))
	var p = world.player
	if p == null:
		return
	# véus de ecrã por baixo do HUD (ordem do jogo web: vinheta, ferida, clarão)
	if tint.a > 0:
		c.draw_rect(Rect2(0, 0, W, 360), Color(tint, tint.a * 0.1))
	c.draw_texture_rect(vignette, Rect2(0, 0, W, 360), false)
	if hurt > 0.01:
		c.draw_texture_rect(red_edges, Rect2(0, 0, W, 360), false, Color(1, 1, 1, minf(1.0, hurt) * 0.75))
	if flash.a > 0:
		c.draw_rect(Rect2(0, 0, W, 360), flash)
	var tsec := Time.get_ticks_msec() / 1000.0
	# ---- medalhão e Lume
	var mx := 8.0
	var my := 6.0
	var C := Vector2(mx + 26, my + 26)
	c.draw_texture_rect(_img("hud_medallion"), Rect2(mx, my, 52, 52), false)
	var lk := clampf(GameState.lume / 100.0, 0, 1)
	var ready := GameState.lume >= 33
	c.draw_arc(C, 12.6, 0, TAU, 48, Color(0.35, 0.2, 0.12, 0.55), 2.4, true)
	if lk > 0.005:
		var pulse := 0.75 + 0.25 * sin(tsec * 4.0) if ready else 0.55
		c.draw_arc(C, 12.6, -PI / 2, -PI / 2 + TAU * lk, 48, Color(1, 0.55, 0.2, 0.5 * pulse), 4.6, true)
		c.draw_arc(C, 12.6, -PI / 2, -PI / 2 + TAU * lk, 48, Color("#ffcf80") if ready else Color("#c88a50"), 1.8, true)
	for i in 3:
		var an := -PI / 2 + TAU * i / 3.0
		c.draw_circle(C + Vector2(cos(an), sin(an)) * 12.6, 1.1, Color("#1a1014"))
	_flame(C + Vector2(0, 4), 1.15 + lk * 0.35, tsec, lk)
	# ---- barra de vida
	var bw: float = 124.0 + 16.0 * (float(p.max_hp) - 100.0) / 25.0
	var bx := mx + 46.0
	var by := C.y - 16.4
	var ix := bx + 27.2
	var iy := by + 13.2
	var ih := 6.4
	var iw := bw - 18.0 + 9.4 - 27.2
	ghost = move_toward(ghost, p.hp, 0.6)
	var hk := clampf(p.hp / p.max_hp, 0, 1)
	var gk := clampf(ghost / p.max_hp, 0, 1)
	c.draw_rect(Rect2(ix, iy, iw, ih), Color(0.055, 0.024, 0.03, 0.92))
	c.draw_rect(Rect2(ix, iy, iw * gk, ih), Color("#d8c4a4"))
	c.draw_rect(Rect2(ix, iy, iw * hk, ih * 0.45), Color("#e0404a"))
	c.draw_rect(Rect2(ix, iy + ih * 0.45, iw * hk, ih * 0.55), Color("#8a1622"))
	c.draw_rect(Rect2(ix, iy + 0.6, iw * hk, 1.0), Color(1, 0.86, 0.82, 0.22))
	if hk < 0.3:
		c.draw_rect(Rect2(ix, iy, iw * hk, ih), Color(1, 0.15, 0.15, 0.18 + 0.15 * sin(tsec * 8.0)))
	var mw := 20.0
	var x := bx + 41.6 - 0.5
	var endx := bx + bw - 18.0
	while x < endx:
		var w := minf(mw, endx - x + 0.5)
		var im := _img("hud_bar_m")
		c.draw_texture_rect_region(im, Rect2(x, by, w, 26.4), Rect2(0, 0, im.get_width() * (w / mw), im.get_height()))
		x += w - 0.5
	c.draw_texture_rect(_img("hud_bar_r"), Rect2(endx, by, 18, 26.4), false)
	c.draw_texture_rect(_img("hud_bar_l"), Rect2(bx, by, 41.6, 26.4), false)
	# ---- círios (frascos de cura)
	for i in GameState.max_flasks:
		var lit := i < GameState.flasks
		var cxp := bx + 30.0 + i * 11.0
		var cyp := by + 24.0
		c.draw_texture_rect(_img("hud_candle_lit" if lit else "hud_candle_out"), Rect2(cxp, cyp, 10, 18), false)
		if lit:
			c.draw_circle(Vector2(cxp + 5, cyp + 2), 5.0, Color(1, 0.7, 0.3, 0.18 + 0.06 * sin(tsec * 9.0 + i)))
	# ---- cinza
	var ay := by + 43.0
	c.draw_texture_rect(_img("hud_ash"), Rect2(bx + 4, ay - 1, 14, 14), false)
	_text(font_body, str(GameState.ash), Vector2(bx + 21, ay + 11), 11, Color("#e8dcc8"))
	# ---- queimadura
	if not p.burn.is_empty():
		_text(font_body, "a arder", Vector2(bx + 30, by + 60), 9, Color(1, 0.6, 0.3, 0.6 + 0.4 * sin(tsec * 10.0)))
	# ---- barra do chefe
	if boss != null and is_instance_valid(boss) and not boss.dead:
		var bk := clampf(boss.hp / boss.max_hp, 0, 1)
		boss_ghost = move_toward(boss_ghost, bk, 0.004)
		var BW := minf(380.0, W - 120.0)
		var bxx := (W - BW) / 2.0
		var byy := 360.0 - 40.0
		var bix := bxx + 12.0
		var biw := BW - 24.0
		c.draw_rect(Rect2(bix, byy + 6.5, biw, 4.5), Color(0.05, 0.02, 0.03, 0.92))
		c.draw_rect(Rect2(bix, byy + 6.5, biw * boss_ghost, 4.5), Color("#d8c4a4"))
		c.draw_rect(Rect2(bix, byy + 6.5, biw * bk, 4.5), Color("#b02a30") if boss.phase == 0 else Color("#e0602a"))
		var xm := bxx + 15.0
		while xm < bxx + BW - 14.0:
			var w2 := minf(12.2, bxx + BW - 14.0 - xm + 0.4)
			c.draw_texture_rect_region(_img("hud_boss_m"), Rect2(xm, byy, w2, 16.46), Rect2(0, 0, 73.0 * (w2 / 12.2), 99))
			xm += w2 - 0.4
		c.draw_texture_rect(_img("hud_boss_l"), Rect2(bxx, byy, 15.49, 16.46), false)
		c.draw_texture_rect(_img("hud_boss_r"), Rect2(bxx + BW - 14.63, byy, 14.63, 16.46), false)
		c.draw_texture_rect(_img("hud_boss_c"), Rect2(W / 2.0 - 15.25, byy, 30.49, 16.46), false)
		_text(font_title, Data.t("boss_coveiro"), Vector2(W / 2.0, byy - 4), 10, Color("#e8d8c0"), true)
	# ---- aviso de interação
	if prompt != "":
		_text(font_body, prompt, Vector2(p.position.x, 0) * 0 + Vector2(W / 2.0, 360.0 - 70.0), 10, Color(0.95, 0.88, 0.78, 0.9), true)
	# ---- mensagens
	var ty := 70.0
	for q in toasts:
		var a := clampf(q["t"], 0, 1)
		var sz := font_body.get_string_size(q["s"], HORIZONTAL_ALIGNMENT_LEFT, -1, int(10 * K)) / K
		c.draw_rect(Rect2(W / 2.0 - sz.x / 2.0 - 10, ty - 11, sz.x + 20, 16), Color(0.03, 0.02, 0.03, 0.6 * a))
		_text(font_body, q["s"], Vector2(W / 2.0, ty + 1), 10, Color(0.95, 0.9, 0.82, a), true)
		ty += 19.0
	# ---- nome da zona
	if banner_t > 0:
		var a2 := clampf(minf(banner_t, 3.2 - banner_t) * 1.5, 0, 1)
		_text(font_title, banner_txt, Vector2(W / 2.0, 120), 20, Color(0.95, 0.86, 0.72, a2), true)
		c.draw_rect(Rect2(W / 2.0 - 90, 128, 180, 0.8), Color(0.9, 0.7, 0.5, a2 * 0.6))
	# ---- inscrição aberta
	if read_body != "":
		c.draw_rect(Rect2(0, 0, W, 360), Color(0, 0, 0, 0.55))
		c.draw_rect(Rect2(W / 2.0 - 170, 110, 340, 140), Color(0.06, 0.05, 0.06, 0.95))
		c.draw_rect(Rect2(W / 2.0 - 170, 110, 340, 140), Color(0.6, 0.48, 0.36), false, 0.8)
		_text(font_title, read_title, Vector2(W / 2.0, 132), 12, Color("#e8d0a8"), true)
		c.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
		c.draw_multiline_string(font_body, Vector2(W / 2.0 - 155, 152) * K, read_body, HORIZONTAL_ALIGNMENT_LEFT, 310 * K, int(10 * K), -1, Color(0.92, 0.88, 0.8))
		c.draw_set_transform(Vector2.ZERO, 0, Vector2(K, K))
	# ---- morte
	if died_t >= 0:
		var a3 := clampf(died_t * 1.2, 0, 0.85)
		c.draw_rect(Rect2(0, 0, W, 360), Color(0.04, 0, 0, a3))
		_text(font_title, "A CHAMA APAGOU-SE", Vector2(W / 2.0, 180), 22, Color(0.8, 0.2, 0.15, clampf(died_t, 0, 1)), true)

## texto desenhado à resolução real (sem esticar letras pequenas)
func _text(f: Font, s: String, at: Vector2, size: int, col: Color, center := false) -> void:
	var fs := int(round(size * K))
	var pos := at * K
	if center:
		pos.x -= f.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x / 2.0
	c.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
	c.draw_string(f, pos + Vector2(1, 1.5) * K * 0.6, s, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(0, 0, 0, col.a * 0.8))
	c.draw_string(f, pos, s, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, col)
	c.draw_set_transform(Vector2.ZERO, 0, Vector2(K, K))
