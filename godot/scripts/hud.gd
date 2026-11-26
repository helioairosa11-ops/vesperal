extends CanvasLayer
## HUD com a arte do jogo web (assets/ui/hud_*): barra de vida com moldura, círios de cura, cinza, barra do chefe,
## avisos, nome da zona, inscrições. Desenhado em unidades lógicas 640×360 (como no jogo web).

var world
var boss = null
var prompt := ""
var prompt_at := Vector2.ZERO
var dlg: Dictionary = {}
var flash := Color(0, 0, 0, 0)
var hurt := 0.0
var fade := 0.0
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
	font_title = UI.f_title
	font_body = UI.f_body
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

# ------------------------------------------------------------------ diálogo (UI.dialogue do jogo web)
func dialogue(lines: Array, choices: Array, cb: Callable) -> void:
	dlg = {"lines": lines, "i": 0, "shown": 0.0, "choices": choices, "cb": cb, "full": "", "ci": 0, "wait": false, "t": 0.0}
	_dlg_show()

func dialogue_open() -> bool:
	return not dlg.is_empty()

func _dlg_show() -> void:
	var l: Dictionary = dlg["lines"][dlg["i"]]
	dlg["full"] = Data.t(l["k"], l.get("p", {})); dlg["shown"] = 0.0

func _dlg_advance() -> void:
	if dlg["wait"]:
		return
	if dlg["shown"] < dlg["full"].length():
		dlg["shown"] = float(dlg["full"].length()); return
	if dlg["i"] < dlg["lines"].size() - 1:
		dlg["i"] += 1; _dlg_show(); Audio.sfx("ui_tab", 0.4); return
	if not dlg["choices"].is_empty():
		dlg["wait"] = true; return
	_dlg_end(-1)

func _dlg_end(choice: int) -> void:
	var cb: Callable = dlg["cb"]
	dlg = {}
	if cb.is_valid():
		cb.call(choice)

func _dlg_update(delta: float) -> void:
	if dlg.is_empty():
		return
	dlg["t"] += delta
	if dlg["shown"] < dlg["full"].length():
		dlg["shown"] = minf(dlg["full"].length(), dlg["shown"] + delta * 55.0 * float(Settings.get_v("text_speed")))
		if randf() < 0.15:
			Audio.sfx("ui_tab", 0.15)
	elif dlg["i"] == dlg["lines"].size() - 1 and not dlg["choices"].is_empty() and not dlg["wait"]:
		dlg["wait"] = true

func _dlg_input(e: InputEvent) -> bool:
	if dlg.is_empty() or not e.is_pressed() or e.is_echo():
		return false
	if dlg["wait"]:
		var n: int = dlg["choices"].size()
		if e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT:
			for i in _dlg_rects.size():
				if _dlg_rects[i].has_point(e.position):
					Audio.sfx("ui_ok"); _dlg_end(i); return true
			return true
		if e.is_action("ui_down") or e.is_action("down"):
			dlg["ci"] = (dlg["ci"] + 1) % n; Audio.sfx("ui_move")
		elif e.is_action("ui_up") or e.is_action("up"):
			dlg["ci"] = (dlg["ci"] - 1 + n) % n; Audio.sfx("ui_move")
		elif e.is_action("ui_accept") or e.is_action("jump") or e.is_action("interact") or e.is_action("attack"):
			Audio.sfx("ui_ok"); _dlg_end(dlg["ci"])
		return true
	if e.is_action("ui_accept") or e.is_action("interact") or e.is_action("jump") or e.is_action("attack") or e.is_action("ui_cancel") \
		or (e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT):
		_dlg_advance()
		return true
	return false

## caixa do diálogo: a moldura larga da interface, retrato na oval dourada e placa com o nome de quem fala
const PORTRAITS := {
	# só os chefes que falam têm retrato (como no jogo web); as pessoas falam sem retrato
	# chefes que falam: retrato tirado da arte nova (tools/make_portraits.py)
	"boss_aldric": "boss_aldric", "boss_caedmon": "boss_caedmon", "boss_corvin": "boss_corvin", "boss_elowen": "boss_elowen",
	"boss_gemeos": "boss_gemeos", "boss_hilde": "boss_hilde", "boss_ozias": "boss_ozias", "boss_seraphine": "boss_seraphine"}
func _draw_dialogue(_W: float) -> void:
	if dlg.is_empty():
		return
	c.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
	var vs := c.get_viewport_rect().size
	var u := vs.y / 900.0
	var dfade := minf(1.0, dlg["t"] / 0.22)
	var l: Dictionary = dlg["lines"][dlg["i"]]
	var sk: String = l.get("s", "") if l.get("s", "") != null else ""
	var speaker: String = Data.t(sk) if sk != "" else ""
	var por: Texture2D = Data.tex("res://art/portraits/%s.png" % PORTRAITS[sk]) if PORTRAITS.has(sk) else null
	var bw := minf(vs.x * 0.92, 1040.0 * u)
	var kb := 0.36 * u
	var pad_x := 58.0 * u
	var pad_t := 46.0 * u
	var pad_b := 40.0 * u
	var por_w := 150.0 * u if por else 0.0
	var tx0 := pad_x + (por_w + 26.0 * u if por else 0.0)
	var inner := bw - tx0 - pad_x
	var italic := speaker == ""
	var f: Font = UI.f_ital if italic else UI.f_body
	var tfs := 22.0 * u
	var full_h := UI.para_h(f, dlg["full"], inner, tfs)
	var ch_h := 0.0
	if dlg["wait"]:
		ch_h = 12.0 * u + dlg["choices"].size() * 46.0 * u
	var min_lines := 2.0 if dlg["wait"] else 3.0
	var bh := maxf(170.0 * u if dlg["wait"] else 196.0 * u, pad_t + maxf(full_h, tfs * 1.3 * min_lines) + ch_h + pad_b)
	var r := Rect2((vs.x - bw) / 2.0, vs.y - 26.0 * u - bh + (1.0 - dfade) * 16.0 * u, bw, bh)
	UI.box(c, r, kb, dfade)
	# retrato recortado na oval
	if por:
		var orc := Rect2(r.position.x + 52.0 * u, r.position.y - 46.0 * u, por_w, por_w * 530.0 / 400.0)
		var cc := orc.position + Vector2(199.0 / 400.0, 274.5 / 530.0) * orc.size
		var rx := 154.0 / 400.0 * orc.size.x
		var ry := 205.0 / 530.0 * orc.size.y
		var pts := PackedVector2Array()
		var uvs := PackedVector2Array()
		for i in 48:
			var an := TAU * i / 48.0
			var pt := cc + Vector2(cos(an) * rx, sin(an) * ry)
			pts.append(pt)
			uvs.append(Vector2(0.5 + (pt.x - cc.x) / (2.0 * ry), 0.5 + (pt.y - cc.y) / (2.0 * ry)))
		c.draw_texture_rect(UI.glow, orc.grow(20 * u), false, Color(0, 0, 0, 0.6 * dfade))
		c.draw_colored_polygon(pts, Color(0.04, 0.03, 0.04, dfade))
		c.draw_polygon(pts, PackedColorArray([Color(1, 1, 1, dfade)]), uvs, por)
		c.draw_texture_rect(UI.tex("oval_ring"), orc, false, Color(1, 1, 1, dfade))
	# placa com o nome
	if speaker != "":
		var nfs := 20.0 * u
		var nw := UI.text_w(UI.f_label, speaker, nfs, 0.08) + 90.0 * u
		var nr := Rect2(r.position.x + tx0 - 24.0 * u, r.position.y - 20.0 * u, nw, 42.0 * u)
		UI.plate(c, nr, false, dfade)
		UI.text(c, UI.f_label, speaker, Vector2(nr.get_center().x, nr.get_center().y + nfs * 0.33), nfs, Color(Color("#ffcf8a"), dfade), 1, 0.08)
	var text: String = dlg["full"].substr(0, int(dlg["shown"]))
	var x := r.position.x + tx0
	var y := r.position.y + pad_t
	UI.para(c, f, text, Vector2(x, y), inner, tfs, Color(Color("#e6d8c4") if italic else Color("#f1e7d6"), dfade), HORIZONTAL_ALIGNMENT_CENTER if italic and not por else HORIZONTAL_ALIGNMENT_LEFT)
	y += maxf(full_h, tfs * 1.3 * min_lines) if not dlg["wait"] else full_h
	_dlg_rects.clear()
	if dlg["wait"]:
		y += 12.0 * u
		for i in dlg["choices"].size():
			var cw := minf(inner, 560.0 * u)
			var cr := Rect2((x + inner / 2.0 - cw / 2.0) if italic and not por else x, y, cw, 42.0 * u)
			var foc: bool = i == dlg["ci"]
			UI.plate(c, cr, foc, dfade)
			UI.text(c, UI.f_label, Data.t(dlg["choices"][i]), Vector2(cr.position.x + 40.0 * u, cr.get_center().y + 6.0 * u), 17.0 * u, Color(Color("#fff3dc") if foc else Color("#e9dfcf"), dfade), 0, 0.03)
			_dlg_rects.append(cr)
			y += 46.0 * u
	elif dlg["shown"] >= dlg["full"].length():
		# brasa a piscar no canto (.dlg-next)
		var bl := 0.55 + 0.45 * sin(dlg["t"] * TAU / 1.2)
		var nc := r.end - Vector2(64.0 * u, 34.0 * u) + Vector2(0, sin(dlg["t"] * 4.0) * 2.0 * u)
		var s8 := 6.0 * u
		c.draw_texture_rect(UI.glow, Rect2(nc - Vector2(14, 14) * u, Vector2(28, 28) * u), false, Color(1, 0.6, 0.25, 0.6 * bl * dfade))
		c.draw_colored_polygon(PackedVector2Array([nc + Vector2(-s8, -s8 * 0.4), nc + Vector2(s8, -s8 * 0.4), nc + Vector2(0, s8 * 0.8)]), Color(Color("#ffb45a"), bl * dfade))
	c.draw_set_transform(Vector2.ZERO, 0, Vector2(K, K))

var _dlg_rects: Array = []

func toast(s: String) -> void:
	if s == "":
		return
	toasts.append({"s": s, "t": 4.0})
	if toasts.size() > 3:
		toasts.pop_front()

func banner(s: String) -> void:
	banner_txt = s; banner_t = 3.2

## inscrições e cartas: abrem um painel da interface (com X, rato e deslocamento)
func read(title: String, body: String, letter := false) -> void:
	UI.open_read(get_tree(), title, body, letter)

## UI.itemGet: placa com o ícone e o nome do que se apanhou
var gets: Array = []
func item_get(id: String, n := 1) -> void:
	gets.append({"id": id, "n": n, "t": 3.2})

func died() -> void:
	died_t = 0.0

func _process(delta: float) -> void:
	for q in toasts:
		q["t"] -= delta
	toasts = toasts.filter(func(q): return q["t"] > 0)
	banner_t = maxf(0.0, banner_t - delta)
	_dlg_update(delta)
	if died_t >= 0:
		died_t += delta
		if died_t > 2.4:
			died_t = -1.0
	c.queue_redraw()

func _unhandled_input(e: InputEvent) -> void:
	if _dlg_input(e):
		get_viewport().set_input_as_handled(); return

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
	var lume_ready := GameState.lume >= 33
	c.draw_arc(C, 12.6, 0, TAU, 48, Color(0.35, 0.2, 0.12, 0.55), 2.4, true)
	if lk > 0.005:
		var pulse := 0.75 + 0.25 * sin(tsec * 4.0) if lume_ready else 0.55
		c.draw_arc(C, 12.6, -PI / 2, -PI / 2 + TAU * lk, 48, Color(1, 0.55, 0.2, 0.5 * pulse), 4.6, true)
		c.draw_arc(C, 12.6, -PI / 2, -PI / 2 + TAU * lk, 48, Color("#ffcf80") if lume_ready else Color("#c88a50"), 1.8, true)
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
	# ---- óleo / incenso em uso: ícone com os segundos que faltam
	var bxp := bx + 4.0
	for bid in ["oil", "incense"]:
		if GameState.buffs.get(bid, 0.0) > 0:
			var left: float = GameState.buffs[bid]
			var ic: Texture2D = Data.tex("res://art/icons/%s.png" % bid)
			var al := 1.0 if left > 5.0 else 0.5 + 0.5 * sin(tsec * 10.0)
			c.draw_texture_rect(ic, Rect2(bxp, ay + 16, 16, 16), false, Color(1, 1, 1, al))
			_text(font_body, str(ceili(left)), Vector2(bxp + 18, ay + 28), 9, Color("#e8dcc8"))
			bxp += 40.0
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
	_draw_prompt(W)
	_draw_dialogue(W)
	_draw_notes()
	# ---- morte
	if died_t >= 0:
		var a3 := clampf(died_t * 1.2, 0, 0.85)
		c.draw_rect(Rect2(0, 0, W, 360), Color(0.04, 0, 0, a3))
		c.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
		var vsd := c.get_viewport_rect().size
		var u := vsd.y / 900.0
		var ta := clampf(died_t * 0.9, 0, 1)
		UI.text(c, UI.f_title, Data.t("death_title"), Vector2(vsd.x / 2.0, vsd.y * 0.47), 54 * u, Color(0.86, 0.24, 0.16, ta), 1, 0.2)
		UI.rule(c, vsd.x / 2.0, vsd.y * 0.47 + 26 * u, 200 * u, u, ta * 0.8)
		UI.text(c, UI.f_ital, Data.t("death_sub"), Vector2(vsd.x / 2.0, vsd.y * 0.47 + 62 * u), 21 * u, Color(0.92, 0.84, 0.76, ta * 0.9), 1)
	c.draw_set_transform(Vector2.ZERO, 0, Vector2(K, K))
	if fade > 0.001:
		c.draw_rect(Rect2(0, 0, W, 360), Color(0, 0, 0, fade))
	if Settings.get_v("show_fps"):
		_text(font_body, "%d FPS" % Engine.get_frames_per_second(), Vector2(W - 34, 352), 8, Color(0.6, 1, 0.6, 0.8), true)
	if Settings.get_v("show_timer"):
		var pt := int(GameState.play_time)
		_text(font_body, "%d:%02d:%02d" % [floori(pt / 3600.0), floori(pt / 60.0) % 60, pt % 60], Vector2(W - 34, 14), 9, Color(0.9, 0.85, 0.78, 0.8), true)

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

## aviso de interação por cima do alvo: ícone do kit (falar / examinar / interagir), tecla e ação numa placa
var prompt_kind := "interact"
func _draw_prompt(_W: float) -> void:
	if prompt == "" or not dlg.is_empty() or UI.is_open():
		return
	c.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
	var vs := c.get_viewport_rect().size
	var u := vs.y / 900.0
	var sp: Vector2 = world.get_viewport().get_canvas_transform() * (prompt_at + Vector2(0, -16))
	var bob := sin(Time.get_ticks_msec() / 1000.0 * 3.0) * 3.0 * u
	var key := Settings.key_label(int(Settings.keys_for("interact")[0])) if not Settings.keys_for("interact").is_empty() else "E"
	var fs := 17.0 * u
	var tw := UI.text_w(UI.f_label, prompt, fs, 0.04)
	var kw := UI.text_w(UI.f_label, key, 15 * u) + 16 * u
	var h := 38.0 * u
	var ic := 44.0 * u
	var w := ic * 0.6 + kw + tw + 58.0 * u
	var r := Rect2(clampf(sp.x - w / 2.0, 8 * u, vs.x - w - 8 * u), maxf(8 * u, sp.y - h + bob), w, h)
	UI.plate(c, r, false, 0.95)
	var icr := Rect2(r.position.x - ic * 0.25, r.get_center().y - ic / 2.0, ic, ic)
	var itex := UI.tex("ic_" + prompt_kind)
	if itex:
		var asp := float(itex.get_width()) / itex.get_height()
		var iw := ic * minf(1.0, asp); var ih := ic / maxf(1.0, asp)
		c.draw_texture_rect(itex, Rect2(icr.get_center() - Vector2(iw, ih) / 2.0, Vector2(iw, ih)), false)
	var kr := Rect2(icr.end.x + 6 * u, r.get_center().y - 12 * u, kw, 24 * u)
	c.draw_rect(kr, Color(0.06, 0.04, 0.06, 0.95))
	c.draw_rect(kr, Color(UI.GOLD, 0.8), false, maxf(1.0, u * 1.2))
	UI.text(c, UI.f_label, key, Vector2(kr.get_center().x, kr.get_center().y + 5.5 * u), 15 * u, Color("#ffd8a0"), 1)
	UI.text(c, UI.f_label, prompt, Vector2(kr.end.x + 12 * u, r.get_center().y + fs * 0.33), fs, Color("#f3e8d6"), 0, 0.04)
	c.draw_set_transform(Vector2.ZERO, 0, Vector2(K, K))

## avisos, itens obtidos e nome da zona (desenhados à resolução real)
func _draw_notes() -> void:
	c.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
	var vs := c.get_viewport_rect().size
	var u := vs.y / 900.0
	var dt := get_process_delta_time()
	# ---- itens obtidos: caixa com o ícone numa casa acesa
	var gy := 150.0 * u
	for g in gets:
		g["t"] -= dt
		var a := clampf(minf(g["t"], 3.2 - g["t"]) * 3.0, 0, 1)
		var nm: String = Data.t("item_%s_name" % g["id"]) + (" ×%d" % g["n"] if g["n"] > 1 else "")
		var w := maxf(UI.text_w(UI.f_title, nm, 22 * u, 0.04), UI.text_w(UI.f_label, Data.t("obtained"), 15 * u, 0.2)) + 210 * u
		var r := Rect2(vs.x / 2.0 - w / 2.0, gy - (1.0 - a) * 12 * u, w, 112 * u)
		UI.box(c, r, 0.3 * u, a)
		var sr := Rect2(r.position.x + 40 * u, r.get_center().y - 34 * u, 68 * u, 68 * u)
		UI.slot(c, sr, true, a)
		var ic := Data.icon(String(g["id"]))
		if ic:
			c.draw_texture_rect(ic, sr.grow(-11 * u), false, Color(1, 1, 1, a))
		UI.text(c, UI.f_label, Data.t("obtained"), Vector2(sr.end.x + 22 * u, r.get_center().y - 8 * u), 15 * u, Color(UI.EMBER, a), 0, 0.2)
		UI.text(c, UI.f_title, nm, Vector2(sr.end.x + 22 * u, r.get_center().y + 22 * u), 22 * u, Color(UI.TITLE, a), 0, 0.04)
		gy += 122 * u
	gets = gets.filter(func(g): return g["t"] > 0)
	# ---- avisos curtos numa placa
	var ty := gy + 10 * u
	for q in toasts:
		var a2 := clampf(q["t"], 0, 1)
		var fs := 18.0 * u
		var w2 := minf(vs.x * 0.8, UI.text_w(UI.f_body, q["s"], fs) + 110 * u)
		var r2 := Rect2(vs.x / 2.0 - w2 / 2.0, ty, w2, 46 * u)
		UI.plate(c, r2, false, a2 * 0.96)
		UI.text(c, UI.f_body, q["s"], Vector2(vs.x / 2.0, r2.get_center().y + fs * 0.33), fs, Color(0.96, 0.91, 0.83, a2), 1)
		ty += 52 * u
	# ---- nome da zona / do chefe
	if banner_t > 0:
		var a3 := clampf(minf(banner_t, 3.2 - banner_t) * 1.5, 0, 1)
		UI.text(c, UI.f_title, banner_txt, Vector2(vs.x / 2.0, vs.y * 0.33), 46 * u, Color(UI.TITLE, a3), 1, 0.14, 4)
		UI.rule(c, vs.x / 2.0, vs.y * 0.33 + 24 * u, 230 * u, u, a3)
	c.draw_set_transform(Vector2.ZERO, 0, Vector2(K, K))
