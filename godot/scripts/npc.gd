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
var seed := 0.0

const LIGHTS := {"ione": ["#ffd8a0", 70.0], "hrolf": ["#ff9040", 60.0], "maren": ["#ffd090", 60.0], "teodoro": ["#c8c0ff", 50.0]}

func setup(d: Dictionary, w) -> void:
	world = w
	nid = d["id"]
	cx = d["x"] * 20.0 + 8.0
	bottom = (d["y"] + 1) * 20.0
	facing = int(d.get("face", -1))
	sh = Data.sheet("npc_" + nid.trim_suffix("_body"))
	seed = randf() * 3.0
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
		_: world.hud.dialogue([{"s": "npc_" + nid, "k": nid + "_meet1"}], [], Callable())

func _say(lines: Array, choices := [], cb := Callable()) -> void:
	world.hud.dialogue(lines, choices, cb)

# ------------------------------------------------------------------ IONE (npcs.js N.ione)
func _talk_ione() -> void:
	var I := func(k: String) -> Dictionary: return {"s": "npc_ione", "k": k}
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
	var H := func(k: String) -> Dictionary: return {"s": "npc_hrolf", "k": k}
	var q: int = int(GameState.flags.get("q_hrolf", 0))
	if q == 0:
		_say([H.call("hrolf_meet1"), H.call("hrolf_meet2"), H.call("hrolf_meet3")], [], func(_c):
			GameState.flags["q_hrolf"] = 1; GameState.save())
		return
	_say([H.call("hrolf_idle" if Data.has_key("hrolf_idle") else "hrolf_meet3")])

# ------------------------------------------------------------------ desenho (sheetDraw)
func _draw() -> void:
	if sh.is_empty():
		return
	var A: Dictionary = sh["meta"]["anims"]
	var dead := nid.ends_with("_body")
	var an := "dead" if dead and A.has("dead") else ("talk" if talking and A.has("talk") else "idle")
	var f := Data.frame(sh, an, t * float(A[an]["fps"]) + seed)
	draw_set_transform(Vector2.ZERO, 0, Vector2(1 if dead else facing, 1))
	Data.draw_frame(self, sh, f)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

## brilho aditivo (o halo da Ione) — desenhado pelo mundo na camada de brilho
func draw_glow(ci: CanvasItem) -> void:
	if nid == "ione":
		var r := 16.0; var a := 0.22 + sin(t * 2.0) * 0.04
		var p := Vector2(cx + facing * 1.5, bottom - 19)
		ci.draw_texture_rect(glow_tex, Rect2(p - Vector2(r, r), Vector2(r, r) * 2.0), false, Color(Color("#ffd8a0"), a))
