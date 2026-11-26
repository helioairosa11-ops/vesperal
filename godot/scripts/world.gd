extends Node2D
## O mundo jogável: carrega salas, passa de sala em sala pelas bordas, combate, chefe, câmara, luz e HUD.

const T := 20
const STEP := 1.0 / 60.0
const ENEMY_KINDS := ["husk", "crawler", "wisp", "sexton", "husk_big", "sentinel", "crossbow", "hound", "thrall", "slag", "smelter", "thornmaid", "drowned", "moth", "gargoyle", "acolyte", "raven", "penitent", "vitrail", "choir"]

var room: Room
var player
var actors: Node2D
var props_node: Node2D
var props_add: Node2D
var fx
var audio
var hud
var cam: Camera2D
var modulate_node: CanvasModulate
const BG_REGION := {"city": "city", "sanct": "sanct", "ramparts": "ramparts", "forge": "forge", "garden": "garden",
	"tower": "tower", "cathedral": "cathedral", "crypt": "crypt", "palace": "throne"}
const BG_ROOM := {"r7_throne": "throne", "r6_dome": "dome", "r1_trials": "trials", "trials": "trials", "trials_bells": "trials",
	"trials_dodge": "trials", "trials_echoes": "trials"}
var bg_rect: TextureRect
var backdrop
var front
var bg_layer: CanvasLayer
var light_tex: Texture2D
var boss = null
var boss_active := false
var boss_trigger_x := -1.0
var doors: Array = []
var interactables: Array = []
var hitstop_t := 0.0
var shake_t := 0.0
var acc := 0.0
var dead_t := 0.0
var flash_c := Color(0, 0, 0, 0)
var hurt := 0.0
var weather: Array = []
var hint_shown: Dictionary = {}

func _ready() -> void:
	# textura radial para todas as luzes 2D
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 1)); g.set_color(1, Color(1, 1, 1, 0))
	g.add_point(0.35, Color(1, 1, 1, 0.55))
	var gt := GradientTexture2D.new()
	gt.gradient = g; gt.fill = GradientTexture2D.FILL_RADIAL
	gt.fill_from = Vector2(0.5, 0.5); gt.fill_to = Vector2(1.0, 0.5)
	gt.width = 256; gt.height = 256
	light_tex = gt
	# fundo pintado da região (parallax lento, como no jogo web)
	bg_layer = CanvasLayer.new(); bg_layer.layer = -10; add_child(bg_layer)
	bg_rect = TextureRect.new()
	bg_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	bg_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg_rect.size = Vector2(2200, 1240)
	bg_rect.modulate = Color(0.62, 0.6, 0.66)
	bg_layer.add_child(bg_rect)
	modulate_node = CanvasModulate.new(); add_child(modulate_node)
	# fundo da região no mesmo canvas do mundo (a escuridão e as luzes também lhe tocam, como no jogo web)
	backdrop = preload("res://scripts/backdrop.gd").new(); backdrop.world = self; backdrop.z_index = -100
	backdrop.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	add_child(backdrop)
	front = preload("res://scripts/front.gd").new(); front.world = self; front.z_index = 40
	add_child(front)
	props_node = Node2D.new(); props_node.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST; add_child(props_node)
	props_node.draw.connect(_draw_props)
	props_add = Node2D.new()
	var pam := CanvasItemMaterial.new(); pam.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	props_add.material = pam; props_add.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	add_child(props_add)
	props_add.draw.connect(_draw_props_add)
	actors = Node2D.new(); actors.z_index = 5; add_child(actors)
	fx = preload("res://scripts/fx.gd").new(); fx.world = self; add_child(fx)
	audio = Audio
	cam = Camera2D.new(); add_child(cam)
	cam.position_smoothing_enabled = true; cam.position_smoothing_speed = 7.0
	hud = preload("res://scripts/hud.gd").new(); hud.world = self; add_child(hud)
	set_process_unhandled_input(true)

func start(room_id: String) -> void:
	load_room(room_id, Vector2.INF)

func _cam_zoom() -> void:
	var vs := get_viewport().get_visible_rect().size
	var z := vs.y / 360.0 * float(Settings.get_v("zoom"))
	cam.zoom = Vector2(z, z)

# ------------------------------------------------------------------ salas
func load_room(id: String, global_pos: Vector2) -> void:
	var _t0 := Time.get_ticks_usec()
	call_deferred("_report_load", _t0, id)
	if room:
		room.queue_free()
	for c in actors.get_children():
		if c != player:
			c.queue_free()
	for n in npcs:
		if is_instance_valid(n): n.queue_free()
	npcs.clear()
	doors.clear(); interactables.clear(); boss = null; boss_active = false; boss_trigger_x = -1.0
	hud.boss = null
	room = preload("res://scripts/room.gd").new()
	add_child(room); move_child(room, props_node.get_index())
	room.setup(id)
	GameState.room = id
	var reg: Dictionary = room.reg
	# escuridão e cor da região
	# igual a G.beginLights(dark da sala ou da região, darkColor): véu escuro com a cor da região
	var dk: float = room.def.get("dark", reg.get("dark", 0.5))
	var dc: Color = Data.color(reg.get("darkColor", "#07060c"))
	modulate_node.color = Color(1, 1, 1).lerp(dc, minf(0.96, dk))
	hud.tint = Data.color(reg.get("tint", "rgba(0,0,0,0)"))
	# pintura de fundo de cada região (e das salas que têm a sua), como no jogo web (backgrounds.js: ART e ROOM_ART)
	var bgk := String(BG_ROOM.get(id, BG_REGION.get(String(reg.get("bg", "city")), "city")))
	var bgp := "res://art/bg/%s.jpg" % bgk
	bg_rect.texture = Data.tex(bgp) if ResourceLoader.exists(bgp) else Data.tex("res://art/bg/city.jpg")
	# câmara presa à sala
	var sz: Vector2 = room.size_px()
	cam.limit_left = 0; cam.limit_top = 0; cam.limit_right = int(sz.x); cam.limit_bottom = int(sz.y)
	_cam_zoom()
	# jogador
	if player == null:
		player = preload("res://scripts/player.gd").new()
		player.world = self
		actors.add_child(player)
	var p: Vector2
	if global_pos != Vector2.INF:
		p = global_pos - Vector2(room.gx, room.gy)
	else:
		p = _spawn_point()
	player.pos = Vector2(p.x - player.size.x / 2, p.y - player.size.y)
	player.vel = Vector2(player.vel.x, minf(player.vel.y, 0))
	player.sync_node()
	cam.reset_smoothing()
	cam.position = Vector2(player.cx, player.cy - 20)
	cam.reset_smoothing()
	_spawn_entities()
	props_node.queue_redraw()
	_init_weather()
	Audio.play_music(String(room.def.get("music", reg.get("music", "r1"))))
	Audio.set_ambience(String(room.def.get("amb", reg.get("amb", "r1"))))
	if room.def.get("area", "") != "":
		hud.banner(Data.t(String(room.def["area"])))
	else:
		hud.banner_t = minf(hud.banner_t, 0.4)

func _spawn_point() -> Vector2:
	for y in room.h:
		for x in room.grid[y].size():
			if room.grid[y][x] == "P":
				return Vector2(x * T + T / 2.0, (y + 1) * T)
	for e in room.def["ents"]:
		if e["t"] == "altar":
			return Vector2(e["x"] * T + T / 2.0 + 24, (e["y"] + 1) * T)
	# primeiro espaço livre perto do meio, depois o chão por baixo dele
	var x: float = room.size_px().x / 2
	for off in [0, 40, -40, 80, -80, 160, -160, 240, -240]:
		var xx: float = x + off
		var y := 30.0
		while y < room.size_px().y - 40 and (room.solid_at(Vector2(xx, y)) or room.solid_at(Vector2(xx, y - 28))):
			y += 10.0
		if y < room.size_px().y - 40:
			return Vector2(xx, room.floor_below(xx, y))
	return Vector2(x, room.floor_below(x, 40))

func _spawn_entities() -> void:
	for e in room.def["ents"]:
		var tp: String = e["t"]
		var x: int = e["x"]; var y: int = e["y"]
		match tp:
			"enemy":
				var k: String = e["k"]
				if not k in ENEMY_KINDS:
					continue
				var en = preload("res://scripts/enemy.gd").new()
				en.world = self
				en.setup(k, x, y)
				actors.add_child(en)
			"boss":
				if e["boss"] == "coveiro" and not GameState.bosses.get("coveiro", false):
					boss_trigger_x = float(e.get("trigger", x - 6)) * T
					boss = preload("res://scripts/boss_coveiro.gd").new()
					boss.world = self
					boss.setup_boss(x, y)
					boss.visible = false
					actors.add_child(boss)
			"door":
				var d := {"x": x, "y": y, "w": int(e.get("w", 1)), "h": int(e.get("h", 1)), "open": String(e.get("open", "")), "shut": false, "k": 0.0}
				d["shut"] = _door_shut(d)
				d["k"] = 1.0 if d["shut"] else 0.0
				doors.append(d)
				_apply_door(d)
			"npc":
				if _npc_present(String(e["id"])):
					var n = preload("res://scripts/npc.gd").new()
					n.setup(e, self)
					props_node.add_sibling(n)
					npcs.append(n)
					interactables.append({"t": "npc", "p": Vector2(n.cx, n.bottom), "node": n})
			"urn":
				interactables.append({"t": "urn", "p": Vector2(x * T + T / 2.0, (y + 1) * T), "hp": 1})
			"altar":
				interactables.append({"t": "altar", "p": Vector2(x * T + T / 2.0, (y + 1) * T), "id": e.get("id", "")})
			"inscription":
				interactables.append({"t": "inscription", "p": Vector2(x * T + T / 2.0, (y + 1) * T), "id": e.get("id", "")})
			"item":
				if not GameState.flags.get("item_%s_%d_%d" % [room.id, x, y], false):
					interactables.append({"t": "item", "p": Vector2(x * T + T / 2.0, (y + 1) * T - 8), "key": "item_%s_%d_%d" % [room.id, x, y], "item": e.get("item", "")})
			"trigger":
				if e.get("hint", "") != "":
					interactables.append({"t": "hint", "r": Rect2(x * T, (y - int(e.get("h", 4)) + 1) * T, T * 2, int(e.get("h", 4)) * T), "hint": e["hint"]})
			"lastflame":
				var L := PointLight2D.new(); L.texture = light_tex; L.color = Color(1, 0.6, 0.25); L.energy = 1.6; L.texture_scale = 2.4
				L.position = Vector2(x * T + T / 2.0, y * T); room.add_child(L)
	if not room.layers.is_empty():
		# luzes dos adereços gravadas do jogo web (Deco.lights): G.light(x, y, r, cor, i, tremor)
		for Ld in room.layers.get("lights", []):
			var PL := PointLight2D.new(); PL.texture = light_tex
			PL.color = Data.color(String(Ld["c"])); PL.energy = float(Ld["i"]) * 1.2
			PL.texture_scale = float(Ld["r"]) * 2.0 / 256.0 * 1.15
			PL.position = Vector2(Ld["x"], Ld["y"])
			if float(Ld.get("f", 0)) > 0:
				PL.set_meta("flicker", true)
			room.add_child(PL)
		backdrop.use_region(String(room.layers["region"]))
		# salas com pintura própria (Cúpula, Trono, Provações)
		var rk := String(BG_ROOM.get(room.id, ""))
		if rk != "" and ResourceLoader.exists("res://art/bg/%s.jpg" % rk):
			backdrop.art = Data.tex("res://art/bg/%s.jpg" % rk); backdrop.region_key = ""
		front.items = room.layers.get("front", []); front.region = String(room.layers["region"])
	else:
		front.items = []
	for pr in (room.def.get("props", []) if room.layers.is_empty() else []):
		if pr["k"] in ["lamppost", "candelabra", "brazier", "lantern", "sconce", "candles"]:
			var L2 := PointLight2D.new(); L2.texture = light_tex; L2.color = Color(1, 0.62, 0.3); L2.energy = 0.9; L2.texture_scale = 1.1
			L2.position = Vector2(pr["x"] * T + T / 2.0, (pr["y"] + 1) * T - 40); room.add_child(L2)
	for it in interactables:
		if it["t"] == "altar":
			# Altar.emitLight: G.light(cx, y, aceso ? 150 : 50, '#ffa040', aceso ? 1 : 0.4)
			var lit: bool = GameState.flags.get("altar_" + String(it["id"]), false)
			var L3 := PointLight2D.new(); L3.texture = light_tex; L3.color = Color("#ffa040")
			L3.energy = 1.2 if lit else 0.5; L3.texture_scale = (150.0 if lit else 50.0) * 2.0 / 256.0 * 1.15
			L3.position = it["p"] + Vector2(0, -26); room.add_child(L3)
			it["light"] = L3

func _door_shut(d: Dictionary) -> bool:
	var o: String = d["open"]
	if o == "bossgate":
		return boss_active
	if o.begins_with("boss:"):
		return not GameState.bosses.get(o.substr(5), false)
	if o.begins_with("embers"):
		return true
	return false

func _apply_door(d: Dictionary) -> void:
	for i in d["w"]:
		for j in d["h"]:
			var k := Vector2i(d["x"] + i, d["y"] + j)
			if d["shut"]:
				room.dyn[k] = true
			else:
				room.dyn.erase(k)

func _refresh_doors() -> void:
	for d in doors:
		var s := _door_shut(d)
		if s != d["shut"]:
			d["shut"] = s
			_apply_door(d)
			audio.sfx("door")
			shake(0.15)

# ------------------------------------------------------------------ ciclo
var transition: Dictionary = {}
@warning_ignore("unused_signal")
signal quit_to_menu

func _unhandled_input(e: InputEvent) -> void:
	if e.is_action_pressed("pause") and not UI.is_open() and not hud.dialogue_open():
		UI.open_pause(self)
	elif e.is_action_pressed("inventory") and not UI.is_open() and not hud.dialogue_open() and not cutscene:
		UI.open_inventory(self)
		get_viewport().set_input_as_handled()

func _notification(what: int) -> void:
	# perder o foco da janela (Alt+Tab) põe o jogo em pausa, como num jogo de PC
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and not UI.is_open() and room != null and not OS.get_cmdline_user_args().has("--autotest"):
		UI.open_pause(self)
var npcs: Array = []
var cutscene := false

## quem está presente (as condições 'cond' das salas do jogo web, para o que já existe na Região 1)
func _npc_present(id: String) -> bool:
	# as mesmas condições das salas do jogo web (rooms: npc cond)
	var q := func(k: String) -> int: return int(GameState.flags.get("q_" + k, 0))
	var B := func(k: String) -> bool: return GameState.bosses.get(k, false)
	var F := func(k: String) -> bool: return GameState.flags.get(k, false)
	var ending: bool = F.call("ending")
	match room.id + ":" + id:
		"r1_sanct:ione": return not B.call("aldric") or ending
		"r7_throne:ione": return B.call("aldric") and not ending
		"r1_sanct:maren": return (GameState.embers() >= 1 or q.call("maren") >= 2 or q.call("teodoro") == 3) and q.call("maren") < 90
		"r2_gate:maren": return GameState.embers() < 1 and q.call("maren") < 2 and q.call("teodoro") != 3
		"r1_sanct:hrolf": return (B.call("caedmon") or q.call("hrolf") >= 50) and q.call("hrolf") != 60
		"r1_market:hrolf": return not B.call("caedmon") and q.call("hrolf") < 50
		"r1_sanct:teodoro": return q.call("teodoro") == 3
		"r4_greenhouse:teodoro": return q.call("teodoro") < 3
		"r3_foundry:hrolf_body": return q.call("hrolf") == 60 and not F.call("hrolf_body_found")
		"r6_reliquary:teodoro_body": return q.call("teodoro") == 4 and not F.call("teo_body_found")
	return false

func restore_region_audio() -> void:
	var reg: Dictionary = room.reg
	Audio.play_music(String(room.def.get("music", reg.get("music", "r1"))))
	Audio.set_ambience(String(room.def.get("amb", reg.get("amb", "r1"))))

func _physics_process(delta: float) -> void:
	if room == null:
		return
	if not transition.is_empty():
		_update_transition(STEP); return
	if hitstop_t > 0:
		hitstop_t -= delta
		for a in actors.get_children():
			if a is Actor:
				a.prev_pos = a.pos
		return
	_step(STEP)

func _step(dt: float) -> void:
	for a in actors.get_children():
		if is_instance_valid(a) and a.has_method("tick") and (a != boss or boss_active):
			a.tick(dt)
	_combat()
	_interact(dt)
	_boss_logic()
	_check_exit()
	fx.step(dt)
	for d in doors:
		d["k"] = move_toward(d["k"], 1.0 if d["shut"] else 0.0, dt * 3.0)
	_weather_step(dt)
	if player.dead:
		dead_t += dt
		if dead_t > 2.2:
			_respawn()

func _process(delta: float) -> void:
	if room == null:
		return
	_cam_zoom()
	var look: float = player.facing * 28.0
	var pp: Vector2 = player.draw_anchor(player.size / 2.0)
	cam.position = Vector2(pp.x + look, pp.y - 20)
	if shake_t > 0:
		shake_t = maxf(0.0, shake_t - delta)
		cam.offset = Vector2(randf_range(-1, 1), randf_range(-1, 1)) * 6.0 * shake_t
	else:
		cam.offset = Vector2.ZERO
	# parallax do fundo: muito lento (é o plano mais longe)
	var vs := get_viewport().get_visible_rect().size
	bg_rect.visible = room.layers.is_empty()
	bg_rect.size = vs * 1.25
	bg_rect.position = Vector2(-cam.get_screen_center_position().x * 0.06, -cam.get_screen_center_position().y * 0.03) - vs * 0.05
	props_node.queue_redraw()
	props_add.queue_redraw()
	flash_c.a = maxf(0.0, flash_c.a - delta * 2.0)
	hud.flash = flash_c
	hurt = maxf(0.0, hurt - delta * 2.2)
	hud.hurt = hurt

# ------------------------------------------------------------------ combate
func _combat() -> void:
	var list := actors.get_children()
	# golpes da protagonista nos inimigos
	for box in player.attack_boxes:
		for a in list:
			if a == player or not is_instance_valid(a) or not a.has_method("on_hit") or a.dead:
				continue
			if a == boss and not boss_active:
				continue
			if box["rect"].intersects(a.hurtbox()) and not a.already_hit(box["id"]):
				if a.on_hit(box):
					GameState.lume = minf(100.0, GameState.lume + 7.0)
					hitstop(box.get("hitstop", 0.05))
					player.on_hit_enemy(box)
		# urnas
		for it in interactables:
			if it["t"] == "urn" and it["hp"] > 0 and box["rect"].has_point(it["p"] + Vector2(0, -8)):
				it["hp"] = 0
				fx.burst(it["p"] + Vector2(0, -8), 14, Color(0.55, 0.45, 0.38), 110.0)
				fx.ash_orbs(it["p"] + Vector2(0, -8), 2)
				GameState.ash += 3
				audio.sfx("break", 0.8)
	# golpes dos inimigos na protagonista
	for a in list:
		if a == player or not is_instance_valid(a) or not ("attack_boxes" in a):
			continue
		for box in a.attack_boxes:
			if box["rect"].intersects(player.hurtbox()) and not player.already_hit(box["id"]):
				player.receive(box)

func spawn_projectile(o: Dictionary) -> void:
	var p = preload("res://scripts/projectile.gd").new()
	p.world = self
	p.setup(o)
	actors.add_child(p)

func hitstop(d: float) -> void:
	hitstop_t = maxf(hitstop_t, d)

func shake(k: float) -> void:
	shake_t = maxf(shake_t, k * float(Settings.get_v("shake")))
	if Settings.get_v("vibration") and k > 0.2:
		for j in Input.get_connected_joypads():
			Input.start_joy_vibration(j, 0.2 * k, 0.6 * k, 0.12 + 0.2 * k)

func flash_screen(c: Color, a: float) -> void:
	# G.flash: sem clarões intensos, no máximo 0,15
	flash_c = Color(c, a if Settings.get_v("flashes") else minf(a, 0.15))

func toast(s: String) -> void:
	hud.toast(s)

# ------------------------------------------------------------------ interação: altares, inscrições, itens, dicas
func _interact(_dt: float) -> void:
	cutscene = hud.dialogue_open() or UI.is_open()
	var pp := Vector2(player.cx, player.bottom)
	# o mais perto (preferindo aquele para quem se está a olhar), só parada no chão — updateInteract do jogo web
	var best = null; var bd := 1e9
	if player.action.is_empty() and player.on_ground and not cutscene:
		for it in interactables:
			if not it["t"] in ["altar", "inscription", "npc", "item"]:
				continue
			var p: Vector2 = it["p"]
			var d: float = absf(p.x - pp.x) + absf(p.y - pp.y) * 0.5 + (14.0 if (p.x - pp.x) * player.facing < -4 else 0.0)
			var rng: float = 34.0 if it["t"] == "npc" else 28.0
			if d < rng and d < bd:
				best = it; bd = d
	if best != null:
		var key: String = {"altar": "act_rest", "inscription": "act_read", "npc": "act_talk", "item": "act_take"}[best["t"]]
		var top: float = best["node"].top_y() if best["t"] == "npc" else best["p"].y - 30.0
		hud.prompt = Data.t(key)
		hud.prompt_kind = {"altar": "interact", "inscription": "examine", "npc": "talk", "item": "interact"}[best["t"]]
		hud.prompt_at = Vector2(best["p"].x, top)
		if Input.is_action_just_pressed("interact") or Input.is_action_just_pressed("up"):
			match best["t"]:
				"altar":
					GameState.flags["altar_" + String(best["id"])] = true
					GameState.altar_room = room.id
					GameState.flasks = GameState.max_flasks
					player.hp = player.max_hp; GameState.hp = GameState.max_hp
					player.burn = {}
					GameState.save()
					audio.sfx("rest")
					fx.burst_o(player.cx, player.bottom - 10, 18, {"color": "#ffb050", "speed": 70.0, "life": 0.8, "size": 1.4, "add": true})
				"inscription":
					GameState.flags["ins_" + String(best["id"])] = true
					var k2 := "ins_%s" % best["id"]
					hud.read(Data.t(k2 + "_t"), Data.t(k2))
				"npc":
					best["node"].interact()
				"item":
					_take_item(best)
	else:
		hud.prompt = ""
	for it in interactables:
		match it["t"]:
			"hint":
				if it["r"].has_point(Vector2(player.cx, player.cy)) and not hint_shown.has(it["hint"]):
					hint_shown[it["hint"]] = true
					toast(Data.t(it["hint"]))

## Pickup.interact do jogo web: dá o item, mostra-o e grava
func _take_item(it: Dictionary) -> void:
	var id: String = it["item"]
	GameState.flags[it["key"]] = true
	it["t"] = "taken"
	GameState.give(id)
	player.max_hp = GameState.max_hp
	if id == "ash_heart": player.hp = player.max_hp
	var cat := String(Data.items.get(id, {}).get("cat", ""))
	audio.sfx("pickup" if cat in ["material", "consumable"] else "pickup_big")
	fx.burst(it["p"], 16, Color(1, 0.8, 0.5), 80.0, true)
	hud.item_get(id)
	if id.begins_with("letter_"):
		hud.read(Data.t("item_%s_name" % id), Data.t("letter_%s_text" % id.trim_prefix("letter_")), true)
	GameState.save()

# ------------------------------------------------------------------ chefe
func _boss_logic() -> void:
	if boss == null or not is_instance_valid(boss):
		return
	if not boss_active and not boss.dead and boss_trigger_x >= 0 and player.cx >= boss_trigger_x and not player.dead:
		boss_active = true
		boss.visible = true
		hud.boss = boss
		hud.banner(Data.t("boss_coveiro"))
		Audio.play_music("sb_coveiro", 0.4)
		_refresh_doors()

func on_boss_defeated(b) -> void:
	audio.sfx("boss_die"); audio.sfx("cov_death"); shake(0.8); flash_screen(Color.WHITE, 0.6); hitstop(0.4)
	fx.burst(Vector2(b.cx, b.cy), 60, Color(1, 0.7, 0.4), 220.0, true)
	boss_active = false
	hud.boss = null
	Audio.stop_music(1.2)
	_refresh_doors()
	hud.item_get("ab_dash")
	toast(Data.t("tut_dash"))
	GameState.save()

func on_player_dead() -> void:
	dead_t = 0.0
	hud.died()

func _respawn() -> void:
	GameState.deaths += 1
	GameState.hp = GameState.max_hp
	player.hp = player.max_hp; player.dead = false; player.action = {}; player.burn = {}
	player.iframes = 1.0
	GameState.flasks = GameState.max_flasks
	var r: String = GameState.altar_room if GameState.altar_room != "" else "r1_wake"
	load_room(r, Vector2.INF)

# ------------------------------------------------------------------ mudar de sala pelas bordas
func _check_exit() -> void:
	if player.dead:
		return
	var sz: Vector2 = room.size_px()
	var c := Vector2(player.cx, player.cy)
	if c.x >= 0 and c.x < sz.x and c.y >= 0 and c.y < sz.y:
		return
	var gp := c + Vector2(room.gx, room.gy)
	var cell := Vector2i(floori(gp.x / (Data.CELL_W * T)), floori(gp.y / (Data.CELL_H * T)))
	var nb := Data.room_at_cell(cell)
	if nb == "" or nb == room.id:
		player.pos.x = clampf(player.pos.x, 0, sz.x - player.size.x)
		return
	var bottom_g := Vector2(player.cx, player.bottom) + Vector2(room.gx, room.gy)
	if boss_active:
		return
	# como no jogo web: escurece 0,07 s, troca de sala, e clareia 0,12 s com a protagonista a continuar o movimento
	transition = {"t": 0.0, "phase": "out", "to": nb, "entry": bottom_g, "vel": player.vel}

func _update_transition(dt: float) -> void:
	var trn := transition
	trn["t"] += dt
	if trn["phase"] == "out":
		hud.fade = minf(1.0, trn["t"] / 0.07)
		if trn["t"] >= 0.07:
			var keep: Dictionary = {} if player.action.get("type", "") in ["dodge", "attack"] else player.action
			var v: Vector2 = trn["vel"]
			load_room(trn["to"], trn["entry"])
			player.vel = v
			if v.y < 0:
				player.vel.y = minf(v.y, -500.0) if player.cy < 40 else v.y
			player.action = keep
			trn["phase"] = "in"; trn["t"] = 0.0
			GameState.room = room.id
			GameState.save()
	else:
		hud.fade = maxf(0.0, 1.0 - trn["t"] / 0.12)
		player.tick(dt)
		fx.step(dt)
		if trn["t"] >= 0.12:
			transition = {}; hud.fade = 0.0

# ------------------------------------------------------------------ tempo de cada região (como weather em js/data/regions.js)
# n: quantas, v: queda (px/s), dx: vento, s: tamanho, c: cor, k: "dot" ponto | "streak" risco de chuva | "glow" brilho que pulsa
const WEATHER := {
	"ash": {"n": 60, "v": [8.0, 22.0], "dx": -4.0, "s": [0.6, 1.6], "c": Color(0.85, 0.8, 0.78, 0.5), "k": "dot"},
	"rain": {"n": 110, "v": [260.0, 340.0], "dx": -40.0, "s": [7.0, 12.0], "c": Color(0.7, 0.8, 0.95, 0.35), "k": "streak"},
	"embers": {"n": 26, "v": [-14.0, -6.0], "dx": 2.0, "s": [0.8, 1.6], "c": Color(1.0, 0.65, 0.3, 0.7), "k": "glow"},
	"sparks": {"n": 34, "v": [-30.0, -12.0], "dx": 3.0, "s": [0.7, 1.4], "c": Color(1.0, 0.55, 0.2, 0.8), "k": "glow"},
	"fireflies": {"n": 22, "v": [-4.0, 4.0], "dx": 0.0, "s": [1.0, 1.8], "c": Color(0.7, 1.0, 0.8, 0.75), "k": "glow"},
	"wind": {"n": 40, "v": [10.0, 26.0], "dx": -70.0, "s": [0.6, 1.3], "c": Color(0.8, 0.78, 0.85, 0.4), "k": "dot"},
	"incense": {"n": 24, "v": [-6.0, -2.0], "dx": 1.0, "s": [0.8, 1.6], "c": Color(1.0, 0.9, 0.7, 0.35), "k": "glow"},
	"ashstorm": {"n": 90, "v": [20.0, 50.0], "dx": -60.0, "s": [0.7, 1.8], "c": Color(1.0, 0.55, 0.35, 0.55), "k": "dot"},
	"dust": {"n": 22, "v": [2.0, 6.0], "dx": 0.5, "s": [0.6, 1.2], "c": Color(0.8, 0.8, 0.9, 0.3), "k": "dot"},
}
var weather_kind := {}

func _init_weather() -> void:
	weather.clear()
	var key := "ash"
	if room != null:
		key = String(room.reg.get("weather", "ash"))
	weather_kind = WEATHER.get(key, WEATHER["ash"])
	for i in int(weather_kind["n"]):
		weather.append({"p": Vector2(randf() * 700, randf() * 400), "s": randf_range(weather_kind["s"][0], weather_kind["s"][1]),
			"v": randf_range(weather_kind["v"][0], weather_kind["v"][1]), "ph": randf() * TAU})

func _weather_step(dt: float) -> void:
	var dx: float = weather_kind.get("dx", -4.0)
	for w in weather:
		w["ph"] += dt
		w["p"] += Vector2(sin(w["ph"]) * 6.0 + dx, w["v"]) * dt
		if w["p"].y > 400: w["p"].y -= 420
		if w["p"].y < -20: w["p"].y += 420
		if w["p"].x < -20: w["p"].x += 720
		if w["p"].x > 700: w["p"].x -= 720

# ------------------------------------------------------------------ desenho de adereços, portões, urnas, altares
func _draw_props() -> void:
	if room == null:
		return
	var pm: Dictionary = Data.props
	var ptex := Data.tex("res://art/sprites/props.png")
	var S: float = pm.get("S", 4)
	for pr in (room.def.get("props", []) if room.layers.is_empty() else []):
		var items = pm["items"].get(pr["k"])
		if items == null:
			continue
		var it: Array = items[0]
		var base := Vector2(pr["x"] * T + T / 2.0, (pr["y"] + 1) * T)
		props_node.draw_texture_rect_region(ptex, Rect2(base - Vector2(it[4], it[5]) / S, Vector2(it[2], it[3]) / S), Rect2(it[0], it[1], it[2], it[3]), Color(0.85, 0.82, 0.86))
	for it2 in interactables:
		match it2["t"]:
			"urn":
				if it2["hp"] > 0:
					_draw_prop_item("urn", it2["p"], ptex, S, pm, int(it2["p"].x / T) % 2 == 1)
			"altar":
				_draw_prop_item("altar", it2["p"], ptex, S, pm)
				if not GameState.flags.get("altar_" + String(it2["id"]), false):
					# apagado: só uma brasa a pulsar na taça (SpritesObj.altar)
					props_node.draw_circle(it2["p"] + Vector2(0, -29 + 0.5), 1.3, Color(1, 0.38, 0.13, 0.35 + sin(Time.get_ticks_msec() / 500.0) * 0.2))
			"inscription":
				_draw_prop_item("inscription", it2["p"], ptex, S, pm)
			"item":
				# SpritesObj.pickup: ponto claro a flutuar com quatro faúlhas a rodar
				var tt := Time.get_ticks_msec() / 1000.0
				var ip: Vector2 = it2["p"] + Vector2(0, sin(tt * 2.5) * 2.0)
				props_node.draw_circle(ip, 2.4, Color("#fff6e0"))
				for q in 4:
					var an := tt * 1.5 + q * PI / 2.0
					props_node.draw_rect(Rect2(ip + Vector2(cos(an), sin(an)) * 5.0 - Vector2(0.5, 0.5), Vector2(1, 1)), Color("#fff6e0"))
	var gtex := Data.tex("res://art/sprites/grate.png")
	for d in doors:
		if d["k"] <= 0.01:
			continue
		var r := Rect2(d["x"] * T, d["y"] * T, d["w"] * T, d["h"] * T)
		var hh: float = r.size.y * d["k"]
		props_node.draw_texture_rect(gtex, Rect2(r.position, Vector2(r.size.x, hh)), false, Color(0.8, 0.78, 0.8))
	# cinza a cair à frente da câmara
	var c := cam.get_screen_center_position() - Vector2(350, 200)
	var wc: Color = weather_kind.get("c", Color(0.85, 0.8, 0.78, 0.5)); var wk: String = weather_kind.get("k", "dot")
	for w in weather:
		var q: Vector2 = c + w["p"]
		match wk:
			"streak":
				props_node.draw_line(q, q + Vector2(weather_kind["dx"], w["v"]).normalized() * w["s"], wc, 1.0)
			"glow":
				var a := 0.5 + 0.5 * sin(w["ph"] * 2.3)
				props_node.draw_circle(q, w["s"] * 1.6, Color(wc.r, wc.g, wc.b, wc.a * 0.25 * a))
				props_node.draw_rect(Rect2(q, Vector2(w["s"], w["s"])), Color(wc.r, wc.g, wc.b, wc.a * a))
			_:
				props_node.draw_rect(Rect2(q, Vector2(w["s"], w["s"])), wc)

func _draw_prop_item(k: String, p: Vector2, ptex: Texture2D, S: float, pm: Dictionary, flip := false) -> void:
	var items = pm["items"].get(k)
	if items == null:
		return
	var it: Array = items[0]
	props_node.draw_set_transform(p, 0, Vector2(-1 if flip else 1, 1))
	props_node.draw_texture_rect_region(ptex, Rect2(-Vector2(it[4], it[5]) / S, Vector2(it[2], it[3]) / S), Rect2(it[0], it[1], it[2], it[3]))
	props_node.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

## brilhos aditivos dos objetos: fogo pintado e auréola do altar aceso, runas por ler (SpritesObj do jogo web)
func _draw_props_add() -> void:
	if room == null:
		return
	var tt := Time.get_ticks_msec() / 1000.0
	var fx_art: Texture2D = Data.tex("res://art/sprites/fx_art.png")
	for it2 in interactables:
		match it2["t"]:
			"altar":
				if GameState.flags.get("altar_" + String(it2["id"]), false):
					# fireArt(flames=[[0,-29,3]], 5.2): fotogramas 2–4 do fogo pintado
					var i := 2 + (int(floor(tt * 10.0 + 0.3 * 17.0)) % 3)
					var hh := 3.0 * 5.2; var ww := 53.0 * hh / 81.0
					var by: float = it2["p"].y - 29.0
					props_add.draw_texture_rect_region(fx_art, Rect2(it2["p"].x - ww / 2.0, by + hh * 0.12 - hh, ww, hh), Rect2(i * 53, 0, 53, 81))
					_glow(props_add, Vector2(it2["p"].x, by - 3), 30.0, Color("#ff9030"), 0.55)
			"item":
				_glow(props_add, it2["p"] + Vector2(0, sin(tt * 2.5) * 2.0), 16.0, Color("#ffd8a0"), 0.7)
			"inscription":
				if not GameState.flags.get("ins_" + String(it2["id"]), false):
					_glow(props_add, it2["p"] + Vector2(0, -14), 18.0, Color("#8aa8ff"), 0.3 + sin(tt * 2.0) * 0.08)

func _glow(ci: CanvasItem, at: Vector2, r: float, c: Color, a: float) -> void:
	ci.draw_texture_rect(fx.radial, Rect2(at - Vector2(r, r), Vector2(r, r) * 2.0), false, Color(c, a))

func _report_load(t0: int, id: String) -> void:
	if OS.is_debug_build():
		print("[sala] %s carregada em %.1f ms" % [id, (Time.get_ticks_usec() - t0) / 1000.0])
