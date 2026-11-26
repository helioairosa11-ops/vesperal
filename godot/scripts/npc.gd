extends Node2D
## Personagem (NPC) — porte de js/game/objects.js (class NPC), js/render/sprites_npc.js (sheetDraw)
## e js/game/npcs.js (o que cada uma diz). Desenhada com as folhas npc_<id> do jogo web.

var world
var nid := ""
var cx := 0.0
var bottom := 0.0
var facing := -1
var t := 0.0
var talking := false
var interactable := true
var range_px := 34.0
var sh: Dictionary = {}
var light: PointLight2D
var glow_tex: Texture2D
var anim_seed := 0.0

const LIGHTS := {"ione": ["#ffd8a0", 70.0], "hrolf": ["#ff9040", 60.0], "maren": ["#ffd090", 60.0], "teodoro": ["#c8c0ff", 50.0]}

func setup(d: Dictionary, w) -> void:
	world = w
	nid = d["id"]
	cx = d["x"] * 20.0 + 8.0
	bottom = (d["y"] + 1) * 20.0
	facing = int(d.get("face", -1))
	sh = Data.sheet("npc_" + nid.trim_suffix("_body"))
	anim_seed = randf() * 3.0
	position = Vector2(cx, bottom)
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	if LIGHTS.has(nid):
		# G.light(cx, cy, r, cor, 0.8)
		light = PointLight2D.new()
		light.texture = w.light_tex
		light.color = Color(LIGHTS[nid][0])
		light.energy = 0.8
		light.texture_scale = LIGHTS[nid][1] / 64.0
		light.position = Vector2(0, -15)
		add_child(light)
	var g := Gradient.new()
	g.offsets = PackedFloat32Array([0.0, 1.0]); g.colors = PackedColorArray([Color(1, 1, 1, 1), Color(1, 1, 1, 0)])
	var gt := GradientTexture2D.new()
	gt.gradient = g; gt.fill = GradientTexture2D.FILL_RADIAL; gt.width = 64; gt.height = 64
	gt.fill_from = Vector2(0.5, 0.5); gt.fill_to = Vector2(1, 0.5)
	glow_tex = gt

func _process(delta: float) -> void:
	t += delta
	if talking and not world.hud.dialogue_open():
		talking = false
	queue_redraw()

func top_y() -> float:
	return bottom - 30.0

func interact() -> void:
	facing = -1 if world.player.cx < cx else 1
	talking = true
	match nid:
		"ione": _talk_ione()
		"hrolf": _talk_hrolf()
		"maren": _talk_maren()
		"teodoro": _talk_teodoro()
		"hrolf_body": _talk_hrolf_body()
		"teodoro_body": _talk_teodoro_body()
		_: world.hud.dialogue([{"s": "npc_" + nid, "k": nid + "_meet1"}], [], Callable())

func _say(lines: Array, choices := [], cb := Callable()) -> void:
	world.hud.dialogue(lines, choices, cb)

# ------------------------------------------------------------------ IONE (npcs.js N.ione)
func _talk_ione() -> void:
	var I := func(key: String) -> Dictionary: return {"s": "npc_ione", "k": key}
	if not GameState.flags.get("met_ione", false):
		# Story.meetIone: música do momento, cinco falas, e a dica do Altar
		Audio.play_music("event")
		_say([I.call("ione_meet1"), I.call("ione_meet2"), I.call("ione_meet3"), I.call("ione_meet4"), I.call("ione_meet5")], [], func(_c):
			GameState.flags["met_ione"] = true
			world.restore_region_audio()
			world.toast(Data.t("hint_rest"))
			GameState.save())
		return
	var k := "ione_hint_end"
	if not GameState.abilities.get("dash", false): k = "ione_hint_dash"
	elif not GameState.bosses.get("caedmon", false): k = "ione_hint_r2"
	elif not GameState.bosses.get("hilde", false): k = "ione_hint_r3"
	elif not GameState.bosses.get("elowen", false): k = "ione_hint_r4"
	elif not GameState.bosses.get("corvin", false): k = "ione_hint_r5"
	elif not GameState.bosses.get("ozias", false): k = "ione_hint_r6"
	elif not GameState.bosses.get("aldric", false): k = "ione_hint_r7"
	_say([I.call(k)])

# ------------------------------------------------------------------ HROLF (npcs.js N.hrolf, início)
func _talk_hrolf() -> void:
	var H := func(key: String) -> Dictionary: return {"s": "npc_hrolf", "k": key}
	var q: int = int(GameState.flags.get("q_hrolf", 0))
	if q == 0:
		_say([H.call("hrolf_meet1"), H.call("hrolf_meet2"), H.call("hrolf_meet3")], [], func(_c):
			GameState.flags["q_hrolf"] = 1; GameState.save())
		return
	_say([H.call("hrolf_idle" if Data.has_key("hrolf_idle") else "hrolf_meet3")])

# ------------------------------------------------------------------ desenho (sheetDraw)
# ------------------------------------------------------------------ MAREN (npcs.js N.maren): vendedora; irmã de Teodoro
func _q(k: String) -> int:
	return int(GameState.flags.get("q_" + k, 0))

func _setq(k: String, v: int) -> void:
	GameState.flags["q_" + k] = v

func _got(id: String) -> void:
	GameState.give(id); world.hud.item_get(id); GameState.save()

func _maren_stock() -> Array:
	var s := [["salt", 80, false], ["oil", 140, false], ["incense", 140, false], ["feather", 60, false],
		["r_heron", 1500, true], ["r_anchor", 1800, true], ["r_amber", 1400, true]]
	if not GameState.flags.get("bought_ash_steel", false): s.append(["ash_steel", 900, true])
	if _q("maren") >= 2: s.append(["w_alabarda", 2200, true])
	if _q("maren") >= 50: s.append(["relic_slot", 2500, true]); s.append(["r_hairshirt", 2000, true])
	# o que é único e já se tem não volta a aparecer
	return s.filter(func(e): return not (e[2] and GameState.has(e[0])))

func _talk_maren() -> void:
	var M := func(key: String) -> Dictionary: return {"s": "npc_maren", "k": key}
	if _q("maren") == 0:
		_say([M.call("maren_meet1"), M.call("maren_meet2"), M.call("maren_meet3")], [], func(_c):
			_setq("maren", 1); _got("teodoro_medal"))
		return
	if _q("teodoro") == 3 and _q("maren") < 50:
		_say([M.call("maren_reunited1"), M.call("maren_reunited2")], [], func(_c):
			_setq("maren", 50); _got("r_rosary"))
		return
	if _q("maren") < 2 and GameState.embers() >= 1:
		_setq("maren", 2)
	var greet := "maren_greet_after" if _q("maren") >= 50 else "maren_greet"
	_say([M.call(greet)], ["opt_buy", "opt_talk", "opt_leave"], func(c):
		if c == 0: _maren_shop()
		elif c == 1:
			var k := "maren_lore_after" if _q("maren") >= 50 else ("maren_lore1" if _q("teodoro") == 0 else "maren_lore2")
			_say([M.call(k)]))

## loja da Maren: cada escolha é um artigo com o preço; compra com cinza e volta a abrir
func _maren_shop() -> void:
	var stock := _maren_stock()
	var opts: Array = []
	for e in stock:
		opts.append("%s — %d" % [Data.t("item_%s_name" % e[0]), e[1]])
	opts.append("opt_leave")
	_say([{"s": "npc_maren", "k": "maren_greet"}], opts, func(c):
		if c < 0 or c >= stock.size():
			return
		var e: Array = stock[c]
		if GameState.ash < int(e[1]):
			world.hud.toast(Data.t("msg_no_ash") if Data.has_key("msg_no_ash") else "Cinza insuficiente")
		else:
			GameState.ash -= int(e[1])
			if e[0] == "ash_steel": GameState.flags["bought_ash_steel"] = true
			_got(String(e[0]))
		_maren_shop())

# ------------------------------------------------------------------ TEODORO (npcs.js N.teodoro): escolha irreversível
func _talk_teodoro() -> void:
	var D := func(key: String) -> Dictionary: return {"s": "npc_teodoro", "k": key}
	if _q("teodoro") == 3:
		if not GameState.has("ossuary_key") and not GameState.flags.get("got_ossuary_key", false):
			_say([D.call("teo_key1"), D.call("teo_key2")], [], func(_c):
				GameState.flags["got_ossuary_key"] = true; _got("ossuary_key"))
			return
		if GameState.bosses.get("ozias", false) and _q("teodoro") < 50:
			_say([D.call("teo_truth1"), D.call("teo_truth2"), D.call("teo_truth3")], [], func(_c):
				_setq("teodoro", 50); GameState.save())
			return
		_say([D.call("teo_after" if GameState.bosses.get("ozias", false) else "teo_wait")])
		return
	if _q("teodoro") == 0:
		_setq("teodoro", 1)
	if not GameState.has("teodoro_medal"):
		_say([D.call("teo_meet1"), D.call("teo_meet2"), D.call("teo_nomedal")], [], func(_c): GameState.save())
		return
	_say([D.call("teo_meet1"), D.call("teo_medal1"), D.call("teo_medal2"), D.call("teo_medal3")], ["opt_teo_sister", "opt_teo_cathedral", "opt_teo_stay"], func(c):
		if c == 0:
			_setq("teodoro", 3); GameState.flags["teodoro_choice"] = "sister"; GameState.take("teodoro_medal")
			_say([D.call("teo_go_sister")], [], func(_c2): _leave())
		elif c == 1:
			_setq("teodoro", 4); GameState.flags["teodoro_choice"] = "cathedral"; GameState.take("teodoro_medal")
			_say([D.call("teo_go_cathedral")], [], func(_c2): _leave())
		else:
			_say([D.call("teo_stay")]))

# ------------------------------------------------------------------ corpos (consequências irreversíveis)
func _talk_hrolf_body() -> void:
	_say([{"s": "", "k": "hrolf_body1"}, {"s": "", "k": "hrolf_body2"}], [], func(_c):
		GameState.flags["hrolf_body_found"] = true; _got("r_hrolf_hammer"); _leave())

func _talk_teodoro_body() -> void:
	_say([{"s": "", "k": "teo_body1"}, {"s": "", "k": "teo_body2"}, {"s": "", "k": "teo_body3"}], [], func(_c):
		GameState.flags["teo_body_found"] = true; _setq("teodoro", 60)
		if _q("maren") < 90: _setq("maren", 95)
		_got("ossuary_key"); world.hud.toast(Data.t("msg_maren_left")); _leave())

## sai de cena (depois de uma escolha): deixa de se poder falar com ele
func _leave() -> void:
	GameState.save()
	world.npcs.erase(self)
	world.interactables = world.interactables.filter(func(it): return it.get("node") != self)
	queue_free()

func _draw() -> void:
	if sh.is_empty():
		return
	var A: Dictionary = sh["meta"]["anims"]
	var dead := nid.ends_with("_body")
	var an := "dead" if dead and A.has("dead") else ("talk" if talking and A.has("talk") else "idle")
	var f := Data.frame(sh, an, t * float(A[an]["fps"]) + anim_seed)
	draw_set_transform(Vector2.ZERO, 0, Vector2(1 if dead else facing, 1))
	Data.draw_frame(self, sh, f)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

## brilho aditivo (o halo da Ione) — desenhado pelo mundo na camada de brilho
func draw_glow(ci: CanvasItem) -> void:
	if nid == "ione":
		var r := 16.0; var a := 0.22 + sin(t * 2.0) * 0.04
		var p := Vector2(cx + facing * 1.5, bottom - 19)
		ci.draw_texture_rect(glow_tex, Rect2(p - Vector2(r, r), Vector2(r, r) * 2.0), false, Color(Color("#ffd8a0"), a))
