extends Node2D
## O mundo jogável: carrega salas, passa de sala em sala pelas bordas, combate, chefe, câmara, luz e HUD.

const T := 20
const STEP := 1.0 / 60.0
const ENEMY_KINDS := ["husk", "crawler", "wisp", "sexton", "husk_big"]

var room: Room
var player
var actors: Node2D
var props_node: Node2D
var fx
var audio
var hud
var cam: Camera2D
var modulate_node: CanvasModulate
var bg_rect: TextureRect
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
	props_node = Node2D.new(); props_node.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST; add_child(props_node)
	props_node.draw.connect(_draw_props)
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
	var z := vs.y / 360.0 * 1.4
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
	var bgk := "sanct" if reg.get("bg", "") == "sanct" else String(reg.get("bg", "city"))
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
	for pr in room.def.get("props", []):
		if pr["k"] in ["lamppost", "candelabra", "brazier", "lantern", "sconce", "candles"]:
			var L2 := PointLight2D.new(); L2.texture = light_tex; L2.color = Color(1, 0.62, 0.3); L2.energy = 0.9; L2.texture_scale = 1.1
			L2.position = Vector2(pr["x"] * T + T / 2.0, (pr["y"] + 1) * T - 40); room.add_child(L2)
	for it in interactables:
		if it["t"] == "altar":
			var L3 := PointLight2D.new(); L3.texture = light_tex; L3.color = Color(1, 0.55, 0.25); L3.energy = 1.3; L3.texture_scale = 1.4
			L3.position = it["p"] + Vector2(0, -30); room.add_child(L3)

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
var npcs: Array = []
var cutscene := false

## quem está presente (as condições 'cond' das salas do jogo web, para o que já existe na Região 1)
func _npc_present(id: String) -> bool:
	var q: int = int(GameState.flags.get("q_hrolf", 0))
	match room.id + ":" + id:
		"r1_sanct:ione": return not GameState.bosses.get("aldric", false)
		"r1_market:hrolf": return not GameState.bosses.get("caedmon", false) and q < 50
		"r1_sanct:hrolf": return GameState.bosses.get("caedmon", false) or q >= 50
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
	var look: float = player.facing * 28.0
	cam.position = Vector2(player.cx + look, player.cy - 20)
	if shake_t > 0:
		shake_t = maxf(0.0, shake_t - delta)
		cam.offset = Vector2(randf_range(-1, 1), randf_range(-1, 1)) * 6.0 * shake_t
	else:
		cam.offset = Vector2.ZERO
	# parallax do fundo: muito lento (é o plano mais longe)
	var vs := get_viewport().get_visible_rect().size
	bg_rect.size = vs * 1.25
	bg_rect.position = Vector2(-cam.get_screen_center_position().x * 0.06, -cam.get_screen_center_position().y * 0.03) - vs * 0.05
	props_node.queue_redraw()
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
	shake_t = maxf(shake_t, k)

func flash_screen(c: Color, a: float) -> void:
	flash_c = Color(c, a)

func toast(s: String) -> void:
	hud.toast(s)

# ------------------------------------------------------------------ interação: altares, inscrições, itens, dicas
func _interact(_dt: float) -> void:
	cutscene = hud.dialogue_open() or hud.read_body != ""
	var pp := Vector2(player.cx, player.bottom)
	# o mais perto (preferindo aquele para quem se está a olhar), só parada no chão — updateInteract do jogo web
	var best = null; var bd := 1e9
	if player.action.is_empty() and player.on_ground and not cutscene:
		for it in interactables:
			if not it["t"] in ["altar", "inscription", "npc"]:
				continue
			var p: Vector2 = it["p"]
			var d: float = absf(p.x - pp.x) + absf(p.y - pp.y) * 0.5 + (14.0 if (p.x - pp.x) * player.facing < -4 else 0.0)
			var rng: float = 34.0 if it["t"] == "npc" else 28.0
			if d < rng and d < bd:
				best = it; bd = d
	if best != null:
		var key: String = {"altar": "act_rest", "inscription": "act_read", "npc": "act_talk"}[best["t"]]
		var top: float = best["node"].top_y() if best["t"] == "npc" else best["p"].y - 30.0
		hud.prompt = "[E/W] " + Data.t(key)
		hud.prompt_at = Vector2(best["p"].x, top)
		if Input.is_action_just_pressed("interact") or Input.is_action_just_pressed("up"):
			match best["t"]:
				"altar":
					GameState.altar_room = room.id
					GameState.flasks = GameState.max_flasks
					player.hp = player.max_hp; GameState.hp = GameState.max_hp
					player.burn = {}
					GameState.save()
					audio.sfx("rest")
					fx.burst_o(player.cx, player.bottom - 10, 18, {"color": "#ffb050", "speed": 70.0, "life": 0.8, "size": 1.4, "add": true})
				"inscription":
					var k2 := "ins_%s" % best["id"]
					hud.read(Data.t(k2 + "_t"), Data.t(k2))
				"npc":
					best["node"].interact()
	else:
		hud.prompt = ""
	for it in interactables:
		match it["t"]:
			"item":
				if pp.distance_to(it["p"]) < 18:
					GameState.flags[it["key"]] = true
					GameState.ash += 25
					fx.burst(it["p"], 16, Color(1, 0.8, 0.5), 80.0, true)
					audio.sfx("pickup")
					toast("Encontraste cinza antiga (+25).")
					it["t"] = "taken"
			"hint":
				if it["r"].has_point(Vector2(player.cx, player.cy)) and not hint_shown.has(it["hint"]):
					hint_shown[it["hint"]] = true
					toast(Data.t(it["hint"]))

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
	audio.sfx("boss_die"); shake(0.8); flash_screen(Color.WHITE, 0.6); hitstop(0.4)
	fx.burst(Vector2(b.cx, b.cy), 60, Color(1, 0.7, 0.4), 220.0, true)
	boss_active = false
	hud.boss = null
	Audio.stop_music(1.2)
	_refresh_doors()
	toast("O Coveiro caiu. Recebeste o Passo de Cinza: carrega em Esquivar no ar.")
	GameState.save()

func on_player_dead() -> void:
	dead_t = 0.0
	hud.died()

func _respawn() -> void:
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
	else:
		hud.fade = maxf(0.0, 1.0 - trn["t"] / 0.12)
		player.tick(dt)
		fx.step(dt)
		if trn["t"] >= 0.12:
			transition = {}; hud.fade = 0.0

# ------------------------------------------------------------------ tempo (cinza a cair)
func _init_weather() -> void:
	weather.clear()
	for i in 70:
		weather.append({"p": Vector2(randf() * 700, randf() * 400), "s": randf_range(0.6, 1.6), "v": randf_range(8, 22), "ph": randf() * TAU})

func _weather_step(dt: float) -> void:
	for w in weather:
		w["ph"] += dt
		w["p"] += Vector2(sin(w["ph"]) * 6.0 - 4.0, w["v"]) * dt
		if w["p"].y > 400: w["p"].y -= 420
		if w["p"].x < -20: w["p"].x += 720

# ------------------------------------------------------------------ desenho de adereços, portões, urnas, altares
func _draw_props() -> void:
	if room == null:
		return
	var pm: Dictionary = Data.props
	var ptex := Data.tex("res://art/sprites/props.png")
	var S: float = pm.get("S", 4)
	for pr in room.def.get("props", []):
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
					_draw_prop_item("urn", it2["p"], ptex, S, pm)
			"altar":
				_draw_prop_item("altar", it2["p"], ptex, S, pm)
				var fl := 1.0 + 0.15 * sin(Time.get_ticks_msec() / 120.0)
				props_node.draw_circle(it2["p"] + Vector2(0, -36), 3.0 * fl, Color(1, 0.7, 0.3))
			"inscription":
				_draw_prop_item("inscription", it2["p"], ptex, S, pm)
			"item":
				var k := 0.6 + 0.4 * sin(Time.get_ticks_msec() / 200.0)
				props_node.draw_circle(it2["p"], 3.5, Color(1, 0.8, 0.45, k))
				props_node.draw_circle(it2["p"], 7.0, Color(1, 0.7, 0.4, 0.2 * k))
	var gtex := Data.tex("res://art/sprites/grate.png")
	for d in doors:
		if d["k"] <= 0.01:
			continue
		var r := Rect2(d["x"] * T, d["y"] * T, d["w"] * T, d["h"] * T)
		var hh: float = r.size.y * d["k"]
		props_node.draw_texture_rect(gtex, Rect2(r.position, Vector2(r.size.x, hh)), false, Color(0.8, 0.78, 0.8))
	# cinza a cair à frente da câmara
	var c := cam.get_screen_center_position() - Vector2(350, 200)
	for w in weather:
		props_node.draw_rect(Rect2(c + w["p"], Vector2(w["s"], w["s"])), Color(0.85, 0.8, 0.78, 0.55))

func _draw_prop_item(k: String, p: Vector2, ptex: Texture2D, S: float, pm: Dictionary) -> void:
	var items = pm["items"].get(k)
	if items == null:
		props_node.draw_rect(Rect2(p - Vector2(6, 14), Vector2(12, 14)), Color(0.4, 0.35, 0.3))
		return
	var it: Array = items[0]
	props_node.draw_texture_rect_region(ptex, Rect2(p - Vector2(it[4], it[5]) / S, Vector2(it[2], it[3]) / S), Rect2(it[0], it[1], it[2], it[3]))

func _report_load(t0: int, id: String) -> void:
	if OS.is_debug_build():
		print("[sala] %s carregada em %.1f ms" % [id, (Time.get_ticks_usec() - t0) / 1000.0])
