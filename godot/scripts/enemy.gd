class_name Enemy
extends Actor
## Inimigo com ataques por fases (antecipação → golpe → recuperação), postura, atordoamento e IA própria.
## Valores e comportamentos copiados do jogo web (js/game/enemies.js).

const TELL_LEAD := 0.42

var kind := ""
var K: Dictionary = {}
var sh: Dictionary = {}
var atk: Dictionary = {}
var cool := 0.0
var stagger := 0.0
var parried := false
var aggro := false
var mode_t := 0.0
var wander := 0
var anim := 0.0
var last_hit_t := 99.0
var flying := false
var hittable := true
var ash_drop := 10
var poise := 20.0
var poise_max := 20.0
var contact_dmg := 0.0
var anim_key := ""
var anim_kt := 0.0
var eye_light: PointLight2D
var surge_t := 0.0
var surging := false

func setup(k: String, tx: int, ty: int) -> void:
	kind = k
	K = kinds()[k]
	var c: Dictionary = K["cfg"]
	size = Vector2(c["w"], c["h"])
	pos = Vector2(tx * 20 + 10 - size.x / 2, (ty + 1) * 20 - size.y)
	hp = c["hp"]; max_hp = hp
	poise = c.get("poise", 20.0); poise_max = poise
	ash_drop = c.get("ash", 10)
	contact_dmg = c.get("contact", 0.0)
	flying = c.get("flying", false)
	gravity = 0.0 if flying else 1350.0
	facing = -1
	team = "enemy"
	cool = randf_range(0.3, 1.2)
	want_face = [-1, 1].pick_random()
	sh = Data.sheet(K.get("sheet", "en_" + k))
	home_x = pos.x + size.x / 2.0

var fx_add: Node2D
var _sm: Dictionary = {}
static var _radial: Texture2D

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	# camada aditiva (globalCompositeOperation 'lighter' do jogo web): clarão de dano, sinais de ataque, rasto da arma
	fx_add = Node2D.new()
	var m := CanvasItemMaterial.new(); m.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	fx_add.material = m
	fx_add.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	fx_add.z_index = 1
	add_child(fx_add)
	fx_add.draw.connect(_draw_add)
	if _radial == null:
		var g := Gradient.new()
		g.set_color(0, Color(1, 1, 1, 1)); g.set_color(1, Color(1, 1, 1, 0))
		var gt := GradientTexture2D.new()
		gt.gradient = g; gt.fill = GradientTexture2D.FILL_RADIAL; gt.width = 64; gt.height = 64
		gt.fill_from = Vector2(0.5, 0.5); gt.fill_to = Vector2(1, 0.5)
		_radial = gt
	if K.has("eye"):
		eye_light = PointLight2D.new()
		eye_light.texture = world.light_tex
		eye_light.color = K["eye"]
		eye_light.energy = 0.7
		eye_light.texture_scale = 0.35
		add_child(eye_light)

# ------------------------------------------------------------------ comportamentos dos tipos da Região 1
static var _kinds: Dictionary = {}
static func kinds() -> Dictionary:
	if not _kinds.is_empty():
		return _kinds
	_kinds = {
		"husk": {
			"cfg": {"w": 14, "h": 30, "hp": 32, "poise": 14, "ash": 12}, "eye": Color(1, 0.55, 0.3),
			"attacks": {
				"swing": {"wind": 0.5, "act": 0.14, "rec": 0.6, "dmg": 13, "hb": [2, 6, 26, 26], "lunge": 70.0, "tell": ""},
				"lunge": {"wind": 0.65, "act": 0.18, "rec": 0.7, "dmg": 16, "hb": [0, 4, 28, 22], "lunge": 200.0, "tell": "white"},
			},
			"think": "_think_husk",
		},
		"crawler": {
			"cfg": {"w": 20, "h": 11, "hp": 18, "poise": 6, "ash": 8, "contact": 9}, "eye": Color(1, 0.5, 0.3),
			"attacks": {
				"pounce": {"wind": 0.45, "act": 0.3, "rec": 0.55, "dmg": 11, "hb": [-6, 0, 22, 12], "lunge": 240.0, "tell": "white"},
				"bite": {"wind": 0.22, "act": 0.1, "rec": 0.38, "dmg": 8, "hb": [4, 0, 15, 10], "lunge": 50.0, "tell": ""},
			},
			"think": "_think_crawler",
		},
		"wisp": {
			"cfg": {"w": 12, "h": 12, "hp": 14, "poise": 4, "ash": 10, "flying": true}, "eye": Color(1, 0.7, 0.3), "center": true,
			"attacks": {
				"spit": {"wind": 0.6, "act": 0.05, "rec": 0.6, "tell": "", "proj": true},
				"dive": {"wind": 0.5, "act": 0.42, "rec": 0.5, "dmg": 13, "tell": "white", "body": true},
			},
			"think": "_think_wisp",
		},
		"sexton": {
			"cfg": {"w": 16, "h": 34, "hp": 60, "poise": 26, "ash": 30}, "eye": Color(1, 0.6, 0.3),
			"attacks": {
				"sweep": {"wind": 0.55, "act": 0.2, "rec": 0.55, "dmg": 16, "hb": [0, 4, 46, 22], "tell": "white"},
				"slam": {"wind": 0.8, "act": 0.15, "rec": 0.8, "dmg": 22, "hb": [8, 0, 34, 14], "tell": "red", "shake": 0.25},
			},
			"think": "_think_sexton",
		},
		# ---------------- Região 2 (Muralhas)
		"sentinel": {
			"cfg": {"w": 16, "h": 32, "hp": 50, "poise": 30, "ash": 22}, "eye": Color(1, 0.55, 0.3), "guard": true,
			"attacks": {
				"thrust": {"wind": 0.5, "act": 0.14, "rec": 0.55, "dmg": 16, "hb": [4, 12, 40, 8], "lunge": 120.0, "tell": "white", "unguard": true},
				"bash": {"wind": 0.35, "act": 0.12, "rec": 0.5, "dmg": 10, "hb": [2, 6, 18, 24], "lunge": 160.0, "tell": "", "sfx": "shield"},
			},
			"think": "_think_sentinel",
		},
		"crossbow": {
			"cfg": {"w": 14, "h": 30, "hp": 26, "poise": 10, "ash": 18}, "eye": Color(1, 0.55, 0.3),
			"attacks": {"shoot": {"wind": 0.85, "act": 0.05, "rec": 0.9, "tell": "white", "sfx": "bolt"}},
			"think": "_think_crossbow",
		},
		"hound": {
			"cfg": {"w": 24, "h": 16, "hp": 28, "poise": 10, "ash": 16}, "eye": Color(1, 0.5, 0.3),
			"attacks": {"bite": {"wind": 0.32, "act": 0.22, "rec": 0.45, "dmg": 13, "hb": [4, 2, 20, 14], "lunge": 280.0, "tell": "", "hop": -160.0}},
			"think": "_think_hound",
		},
		# ---------------- Região 3 (Forjas)
		"thrall": {
			"cfg": {"w": 20, "h": 34, "hp": 75, "poise": 40, "ash": 32}, "eye": Color(1, 0.48, 0.19), "heavy": true,
			"attacks": {
				"slam": {"wind": 0.85, "act": 0.14, "rec": 0.9, "dmg": 24, "hb": [6, 0, 30, 30], "tell": "red", "armor": true, "shake": 0.3, "waves": true},
				"swipe": {"wind": 0.5, "act": 0.16, "rec": 0.6, "dmg": 16, "hb": [0, 8, 36, 22], "tell": "white", "lunge": 60.0, "sfx": "swing_heavy"},
			},
			"think": "_think_thrall",
		},
		"slag": {
			"cfg": {"w": 18, "h": 14, "hp": 24, "poise": 6, "ash": 10, "contact": 11}, "eye": Color(1, 0.4, 0.1),
			"attacks": {},
			"think": "_think_slag",
		},
		"smelter": {
			"cfg": {"w": 16, "h": 30, "hp": 36, "poise": 14, "ash": 22}, "eye": Color(1, 0.45, 0.15),
			"attacks": {"lob": {"wind": 0.7, "act": 0.05, "rec": 0.8, "tell": "", "sfx": "swing"}},
			"think": "_think_smelter",
		},
	}
	# gigante (husk_big): o mesmo Cinzento a 1,85×, mais vida e golpes mais fortes
	var big: Dictionary = _kinds["husk"].duplicate(true)
	big["sheet"] = "en_husk_big"
	big["cfg"] = {"w": 26, "h": 56, "hp": 130, "poise": 70, "ash": 75}
	for an in big["attacks"]:
		var a: Dictionary = big["attacks"][an]
		a["dmg"] = round(a["dmg"] * 1.6)
		a["hb"] = (a["hb"] as Array).map(func(v): return v * 1.85)
		a["wind"] = a["wind"] * 1.2
	_kinds["husk_big"] = big
	return _kinds

var player:
	get: return world.player

func dx() -> float:
	return player.cx - cx

func dy() -> float:
	return player.cy - cy

func face() -> void:
	facing = 1 if dx() > 0 else -1

func sees(range_x: float, vert := 90.0) -> bool:
	if player.dead:
		return false
	return absf(dx()) <= range_x and absf(dy()) <= vert

func ledge_ahead(dir: int) -> bool:
	var fx := pos.x + size.x + 2 if dir > 0 else pos.x - 2
	var fy := bottom + 4
	return not world.room.solid_at(Vector2(fx, fy)) and not world.room.is_platform(floori(fx / 20.0), floori(fy / 20.0))

func wall_ahead(dir: int) -> bool:
	var fx := pos.x + size.x + 2 if dir > 0 else pos.x - 2
	return world.room.solid_at(Vector2(fx, bottom - 6))

func walk(dir: int, speed: float, dt: float) -> bool:
	if dir == 0:
		vel.x = move_toward(vel.x, 0, 900 * dt); return true
	if (on_ground and ledge_ahead(dir)) or wall_ahead(dir):
		vel.x = 0; return false
	vel.x = move_toward(vel.x, dir * speed, 1100 * dt)
	return true

func fly_to(target: Vector2, speed: float, dt: float) -> void:
	var d := target - Vector2(cx, cy)
	var v := d.normalized() * minf(speed, d.length() * 3.0)
	vel = vel.lerp(v, 1.0 - exp(-dt * 3.0))

func attack(nm: String) -> void:
	var s: Dictionary = K["attacks"][nm]
	atk = {"name": nm, "s": s, "t": 0.0, "phase": "wind", "id": Actor.new_attack_id()}
	face()
	if s.get("tell", "") == "red":
		world.audio.sfx("danger_tell", 0.7)

# ------------------------------------------------------------------ ciclo
func tick(dt: float) -> void:
	super.tick(dt)
	anim += dt
	last_hit_t += dt
	attack_boxes.clear()
	if dead:
		# como no jogo web: abranda, desfaz-se em cinza a partir de 0,3 s e desaparece aos 0,7 s
		_death_t += dt
		vel.x *= 0.9
		if not flying:
			physics(dt, false)
		if _death_t > 0.3 and not is_boss():
			world.fx.dissolve(self, MATS.get(kind, {}).get("ashCol", "#ff9040"))
		if _death_t > 0.7 and not is_boss():
			queue_free()
		return
	if not flying:
		_dist += absf(vel.x) * dt
	cool = maxf(0.0, cool - dt)
	if stagger > 0:
		stagger -= dt
		vel.x = move_toward(vel.x, 0, 600 * dt)
		if flying:
			vel.y = move_toward(vel.y, 0, 600 * dt)
	else:
		call(K["think"], dt)
		_update_attack(dt)
	if flying:
		pos += vel * dt
		# não atravessa paredes
		if world.room.rect_solid(Rect2(pos, size)):
			pos -= vel * dt; vel *= -0.3
	else:
		physics(dt)
	if contact_dmg > 0 and not dead:
		attack_boxes.append({"rect": Rect2(pos, size), "dmg": contact_dmg, "id": -get_instance_id() * 10 - int(t), "parryable": false, "knock": 140.0, "src": self})

func _update_attack(dt: float) -> void:
	if atk.is_empty():
		return
	var s: Dictionary = atk["s"]
	atk["t"] += dt
	match atk["phase"]:
		"wind":
			if s.has("lunge"):
				vel.x = move_toward(vel.x, 0, 900 * dt)
			if atk["t"] >= s["wind"]:
				atk["phase"] = "act"; atk["t"] = 0.0
				if s.has("lunge") and on_ground:
					vel.x = facing * s["lunge"]
				_on_act(atk["name"], s)
		"act":
			if s.has("hb"):
				var b: Array = s["hb"]
				attack_boxes.append({"rect": front(b[0], b[1], b[2], b[3]), "dmg": s["dmg"], "id": atk["id"], "parryable": s.get("tell", "") != "red", "unblockable": s.get("tell", "") == "red", "knock": 170.0, "src": self, "fire": s.get("fire", false)})
			if s.get("body", false):
				attack_boxes.append({"rect": Rect2(pos - Vector2(2, 2), size + Vector2(4, 4)), "dmg": s["dmg"], "id": atk["id"], "parryable": true, "knock": 160.0, "src": self})
			_during(atk["name"], s, dt)
			if atk["t"] >= s["act"]:
				atk["phase"] = "rec"; atk["t"] = 0.0
				if s.has("lunge"):
					vel.x *= 0.3
		"rec":
			vel.x = move_toward(vel.x, 0, 900 * dt)
			if atk["t"] >= s["rec"]:
				_on_end(atk["name"])
				atk = {}
				cool = randf_range(0.5, 1.1)
				# depois de golpear, às vezes dá um passo atrás (não fica colado à espera de levar)
				if randf() < 0.4:
					backoff_t = randf_range(0.2, 0.4)

func _on_act(nm: String, s: Dictionary) -> void:
	if s.get("shake", 0.0) > 0:
		world.shake(s["shake"]); world.audio.sfx("crush")
		world.fx.dust(Vector2(cx + facing * 26, bottom), 10)
	else:
		world.audio.sfx(String(s.get("sfx", "swing")))
	if kind == "wisp" and nm == "spit":
		var a := (Vector2(player.cx, player.cy) - Vector2(cx, cy)).normalized()
		world.audio.sfx("shoot")
		world.spawn_projectile({"pos": Vector2(cx + facing * 2, cy + 2), "vel": a * 150.0, "size": Vector2(9, 9), "dmg": 12.0, "kind": "orb", "color": Color("#ff9040"), "trail": true, "life": 4.0})
	if kind == "crossbow" and nm == "shoot":
		var o := Vector2(cx + facing * 12, pos.y + 12)
		world.spawn_projectile({"pos": o, "vel": Vector2(facing * 330.0, 0), "size": Vector2(12, 4), "dmg": 15.0, "kind": "bolt", "color": Color("#c0b090"), "life": 3.0})
	if s.get("waves", false):
		# o martelo no chão solta duas ondas de choque, uma para cada lado
		for sd in [-1, 1]:
			world.spawn_projectile({"pos": Vector2(cx + facing * 22, bottom - 6), "vel": Vector2(sd * 170.0, 0), "size": Vector2(14, 10), "dmg": 12.0, "kind": "shockwave", "color": Color("#ff8040"), "life": 1.1, "solid": false, "parryable": false})
	if kind == "smelter" and nm == "lob":
		var ddx: float = player.cx - cx
		world.spawn_projectile({"pos": Vector2(cx, pos.y + 4), "vel": Vector2(ddx / 0.9, -330.0), "grav": 700.0, "size": Vector2(10, 10), "dmg": 15.0, "kind": "molten", "color": Color("#ff7020"), "life": 3.0, "parryable": false, "fire": true, "on_wall": "fire"})
	if s.has("hop") and on_ground:
		vel.y = s["hop"]
	if kind == "wisp" and nm == "dive":
		var a2 := (Vector2(player.cx, player.cy) - Vector2(cx, cy)).normalized()
		vel = a2 * 260.0

var guarding := false
var circle_t := 0.0

func _during(_name: String, _s: Dictionary, _dt: float) -> void:
	pass

func _on_end(nm: String) -> void:
	if kind == "crawler" and nm == "bite":
		vel.x = -facing * 110.0
	if kind == "wisp":
		vel *= 0.3

# ================================================================== IA
## Perceção: vê a protagonista se estiver perto, à frente (ou muito perto, ouve-a) e sem paredes no meio.
## Memória: depois de a perder de vista, vai ao último sítio onde a viu durante uns segundos e depois volta à ronda.
## Combate: fica na sua distância (com margem para não tremer), espera a vez (no máximo dois a atacar ao mesmo
## tempo), escolhe golpes conforme a distância sem repetir sempre o mesmo, recua depois de atacar, reage aos teus
## golpes e às tuas esquivas, e nunca se atira de uma plataforma às cegas.
var home_x := 0.0
var last_seen := Vector2.INF
var memory := 0.0
var alert_t := 0.0
var turn_t := 0.0
var want_face := -1
var last_atk := ""
var backoff_t := 0.0
var strafe_t := 0.0
var react_cd := 0.0
var hold := false

func _sense(range_x: float, vert: float, hear := 46.0) -> bool:
	if player == null or player.dead:
		return false
	var d := Vector2(dx(), dy())
	if absf(d.x) > range_x or absf(d.y) > vert:
		return false
	var in_front := signf(d.x) == facing or absf(d.x) < 8
	if not in_front and d.length() > hear and not aggro:
		return false
	return world.room.ray_clear(Vector2(cx, pos.y + 6), Vector2(player.cx, player.pos.y + 8))

## percebe e atualiza o estado de alerta; devolve true quando está a combater
func _perceive(dt: float, range_x: float, vert := 90.0) -> bool:
	react_cd = maxf(0.0, react_cd - dt)
	backoff_t = maxf(0.0, backoff_t - dt)
	if _sense(range_x, vert):
		if not aggro:
			aggro = true; alert_t = 0.28    # um instante de surpresa antes de avançar
			want_face = 1 if dx() > 0 else -1; facing = want_face
		last_seen = Vector2(player.cx, player.bottom); memory = 3.0
	elif aggro:
		memory -= dt
		if memory <= 0:
			aggro = false; last_seen = Vector2.INF
	alert_t = maxf(0.0, alert_t - dt)
	return aggro

## vira-se para a protagonista com um pequeno atraso (dá para lhe passar por trás)
func _turn_to(target_x: float, dt: float, delay := 0.16) -> void:
	var w := 1 if target_x > cx else -1
	if w != facing:
		turn_t += dt
		if turn_t >= delay:
			facing = w; turn_t = 0.0
	else:
		turn_t = 0.0

## ainda há chão para onde vai? (deixa descer degraus pequenos, nunca abismos)
func _safe_step(dir: int) -> bool:
	var fx := pos.x + size.x + 3 if dir > 0 else pos.x - 3
	if world.room.solid_at(Vector2(fx, bottom - 6)) or world.room.solid_at(Vector2(fx, pos.y + 4)):
		return false
	for k in range(0, 4):
		var fy := bottom + 4 + k * 20
		if world.room.solid_at(Vector2(fx, fy)) or world.room.is_platform(floori(fx / 20.0), floori(fy / 20.0)):
			return true
	return false

## outro inimigo à frente, colado? (não se empilham)
func _crowded(dir: int) -> bool:
	for a in world.actors.get_children():
		if a == self or not (a is Actor) or a.dead or a == world.player or not a.has_method("on_parried"):
			continue
		if absf(a.bottom - bottom) < 20 and signf(a.cx - cx) == dir and absf(a.cx - cx) < (size.x + a.size.x) * 0.5 + 6:
			return true
	return false

func _go(dir: int, speed: float, dt: float) -> bool:
	if dir == 0:
		vel.x = move_toward(vel.x, 0, 900 * dt); return true
	if not on_ground and not flying:
		return true
	if not _safe_step(dir) or _crowded(dir):
		vel.x = move_toward(vel.x, 0, 1200 * dt); return false
	vel.x = move_toward(vel.x, dir * speed, 1100 * dt)
	return true

## ronda calma perto de casa, com pausas
func _patrol(dt: float, speed: float, radius := 90.0) -> void:
	mode_t -= dt
	if mode_t <= 0:
		mode_t = randf_range(1.2, 3.2)
		if absf(cx - home_x) > radius:
			wander = 1 if home_x > cx else -1
		else:
			wander = [-1, 0, 0, 1].pick_random()
		if wander != 0:
			facing = wander
	if not _go(wander, speed, dt):
		wander = -wander if wander != 0 else 0
		if wander != 0:
			facing = wander
		mode_t = minf(mode_t, randf_range(0.4, 1.0))

## vez de atacar: no máximo dois inimigos a atacar a protagonista ao mesmo tempo
func _can_take_turn() -> bool:
	var n := 0
	for a in world.actors.get_children():
		if a != self and a is Actor and not a.dead and a.has_method("on_parried") and not a.atk.is_empty():
			n += 1
	return n < 2

func _choose(options: Array) -> String:
	# options: [[nome, peso]]; o último golpe pesa menos (variedade)
	var total := 0.0
	for o in options:
		total += o[1] * (0.45 if o[0] == last_atk else 1.0)
	var r := randf() * total
	for o in options:
		r -= o[1] * (0.45 if o[0] == last_atk else 1.0)
		if r <= 0:
			return o[0]
	return options[0][0]

func _start(nm: String) -> void:
	last_atk = nm
	attack(nm)

## a protagonista está a atacar perto e à frente?
func _player_threat(range_x: float) -> bool:
	return player.action.get("type", "") == "attack" and absf(dx()) < range_x and signf(cx - player.cx) == player.facing

## ataque de chão comum: aproxima-se até à distância do golpe, espera a vez, ataca, recua um pouco
func _melee(dt: float, speed: float, reach: float, options_near: Array, options_far: Array, far_reach: float) -> void:
	if alert_t > 0:
		vel.x = move_toward(vel.x, 0, 900 * dt); return
	var tx: float = player.cx if _sense(400, 140) else last_seen.x
	_turn_to(tx, dt)
	var d := absf(tx - cx)
	var dir := 1 if tx > cx else -1
	if backoff_t > 0:
		_go(-dir, speed * 0.8, dt); return
	var same_level := absf(dy()) < 34
	if cool <= 0 and same_level and facing == dir and _can_take_turn():
		if d < reach:
			_start(_choose(options_near)); return
		if not options_far.is_empty() and d < far_reach and d > reach * 0.9:
			_start(_choose(options_far)); return
	# distância de espera: um pouco fora do alcance enquanto não é a sua vez
	var band := reach * (0.85 if cool <= 0 else 1.6)
	if d > band + 8:
		hold = false
		if not _go(dir, speed, dt):
			# não consegue chegar (abismo, parede): fica à beira, de frente, à espera
			vel.x = move_toward(vel.x, 0, 900 * dt)
	elif d < band - 12 and cool > 0:
		_go(-dir, speed * 0.6, dt)
	else:
		vel.x = move_toward(vel.x, 0, 900 * dt)

func _think_husk(dt: float) -> void:
	if not atk.is_empty():
		return
	if _perceive(dt, 190):
		# o Cinzento é lento e teimoso: avança, golpeia; às vezes lança-se de mais longe
		var big := kind == "husk_big"
		var reach := 30.0 * (1.7 if big else 1.0)
		_melee(dt, 34.0 if big else 50.0, reach, [["swing", 3.0], ["lunge", 1.0]], [["lunge", 1.0]], reach * 2.4)
		if cool > 0.25 and last_atk == "lunge" and randf() < 0.01:
			backoff_t = 0.35
	else:
		_patrol(dt, 22)

func _think_crawler(dt: float) -> void:
	if not atk.is_empty():
		return
	surge_t -= dt
	if surge_t <= 0:
		surging = not surging
		surge_t = randf_range(0.28, 0.42) if surging else randf_range(0.14, 0.3)
	if _perceive(dt, 210, 60):
		if alert_t > 0:
			return
		_turn_to(player.cx, dt, 0.08)
		var d := absf(dx())
		var dir := 1 if dx() > 0 else -1
		# rastejante nervoso: se a protagonista ataca perto, salta para trás
		if react_cd <= 0 and _player_threat(40) and on_ground and randf() < 0.55:
			vel = Vector2(-dir * 170, -120); react_cd = 1.2; return
		if backoff_t > 0:
			_go(-dir, 120, dt); return
		if cool <= 0 and on_ground and absf(dy()) < 30 and _can_take_turn():
			if d < 26:
				_start("bite"); backoff_t = 0.0; return
			if d > 44 and d < 96:
				_start("pounce"); vel.y = -160; return
		# avança aos arrancos e, depois de morder, afasta-se para voltar a atacar
		if d > 30:
			_go(dir, 118.0 if surging else 12.0, dt)
		elif cool > 0:
			_go(-dir, 70, dt)
	else:
		if not _go(facing, 46.0 if surging else 0.0, dt):
			facing *= -1

func _think_wisp(dt: float) -> void:
	if _perceive(dt, 240, 170):
		if not atk.is_empty():
			if atk["name"] != "dive" or atk["phase"] == "rec":
				vel *= 0.92
			return
		# chama errante: mantém-se de lado e acima, muda de lado de vez em quando, e foge se a protagonista se aproxima
		strafe_t -= dt
		if strafe_t <= 0:
			strafe_t = randf_range(2.0, 3.5)
			want_face = -want_face if randf() < 0.5 else want_face
		var side := want_face if want_face != 0 else 1
		var target := Vector2(player.cx + side * 96, player.cy - 64 + sin(anim * 2.0) * 18.0)
		if Vector2(dx(), dy()).length() < 50:
			target = Vector2(cx, cy) - Vector2(dx(), dy()).normalized() * 80.0
		fly_to(target, 90, dt)
		face()
		if cool <= 0 and _can_take_turn():
			var d := Vector2(dx(), dy()).length()
			_start("dive" if d < 130 and randf() < 0.4 and last_atk != "dive" else "spit")
	else:
		vel = vel.lerp(Vector2(sin(anim) * 12.0, cos(anim * 1.3) * 8.0), 0.05)

func _think_sexton(dt: float) -> void:
	if not atk.is_empty():
		return
	if _perceive(dt, 210):
		# o Sacristão guarda distância: varre de longe, bate no chão quando estás parado perto ou depois de levar golpes
		var d := absf(dx())
		if d < 24 and cool > 0.3 and react_cd <= 0:
			backoff_t = 0.4; react_cd = 1.0
		var slam_w := 2.0 if absf(player.vel.x) < 20 else 0.6
		if last_hit_t < 0.8:
			slam_w += 1.5
		_melee(dt, 40, 50, [["sweep", 2.0], ["slam", slam_w]], [], 0.0)
	else:
		_patrol(dt, 18, 60)

# ---------------- Região 2
## Sentinela: escudo sempre à frente (só baixa a guarda na estocada); se a encostam, empurra com o escudo
func _think_sentinel(dt: float) -> void:
	if not atk.is_empty():
		guarding = not atk["s"].get("unguard", false) or atk["phase"] == "rec"
		return
	guarding = true
	if _perceive(dt, 200):
		var d := absf(dx())
		if d < 26 and cool <= 0 and _can_take_turn():
			_start("bash"); return
		_melee(dt, 38, 52, [["thrust", 1.0]], [], 0.0)
	else:
		_patrol(dt, 18, 60)

## Besteiro: mantém distância e dispara ao nível da protagonista
func _think_crossbow(dt: float) -> void:
	if not atk.is_empty():
		return
	if _perceive(dt, 300, 60):
		if alert_t > 0:
			return
		face()
		var d := absf(dx())
		if d < 70:
			_go(-facing, 60, dt)
		else:
			vel.x = move_toward(vel.x, 0, 900 * dt)
		if cool <= 0 and absf(dy()) < 40 and d < 320 and _can_take_turn():
			_start("shoot")
	else:
		_patrol(dt, 16, 50)

## Cão de Cinza: uiva ao ver, rodeia a galope e salta quando lhe viram costas ou param
func _think_hound(dt: float) -> void:
	if not atk.is_empty():
		return
	var was := aggro
	if _perceive(dt, 260, 80):
		if not was:
			world.audio.sfx("howl", 0.35); circle_t = randf_range(0.6, 1.2)
		var p = player
		var d := absf(dx())
		var exposed: bool = ((p.facing > 0) == (cx < p.cx)) or absf(p.vel.x) < 10
		circle_t -= dt
		if d < 90 and cool <= 0 and on_ground and (exposed or circle_t <= 0) and _can_take_turn():
			face(); _start("bite"); circle_t = randf_range(1.0, 1.8); return
		if d < 60:
			facing = 1 if cx > p.cx else -1; _go(facing, 110, dt)
		elif d > 120:
			face(); _go(facing, 150, dt)
		else:
			face(); _go(facing if sin(anim * 2.2) > 0 else -facing, 70, dt)
	else:
		_patrol(dt, 25, 90)

# ---------------- Região 3
## Escravo da Forja: lento e pesado, martela o chão (ondas para os dois lados) ou varre
func _think_thrall(dt: float) -> void:
	if not atk.is_empty():
		return
	if _perceive(dt, 220):
		_melee(dt, 32, 48, [["slam", 1.0], ["swipe", 1.0]], [], 0.0)
	else:
		_patrol(dt, 14, 50)

var hop_t := 0.8
## Escória: salta aos saltos para cima de quem a vê; ao morrer parte-se em duas mais pequenas
func _think_slag(dt: float) -> void:
	_perceive(dt, 220, 100)
	hop_t -= dt
	if on_ground:
		vel.x = move_toward(vel.x, 0, 600 * dt)
		if hop_t <= 0:
			hop_t = randf_range(0.7, 1.3)
			if aggro: face()
			else: facing = [-1, 1].pick_random()
			vel.y = -randf_range(240, 330); vel.x = facing * randf_range(80, 130)
			world.audio.sfx("splash", 0.2)

## Fundidor: fica longe e atira metal fundido em arco (deixa fogo onde cai)
func _think_smelter(dt: float) -> void:
	if not atk.is_empty():
		return
	if _perceive(dt, 280, 140):
		if alert_t > 0:
			return
		face()
		var d := absf(dx())
		if d < 60: _go(-facing, 50, dt)
		else: vel.x = move_toward(vel.x, 0, 900 * dt)
		if cool <= 0 and d < 300 and _can_take_turn():
			_start("lob")
	else:
		_patrol(dt, 14, 50)

# ------------------------------------------------------------------ dano
func on_hit(box: Dictionary) -> bool:
	if dead or not hittable:
		return false
	var src0 = box.get("src")
	if K.get("guard", false) and guarding and stagger <= 0 and src0 != null and is_instance_valid(src0) and signf(src0.cx - cx) == facing:
		if box.get("kind", "") in ["heavy", "riposte"]:
			guarding = false; do_stagger(0.5, false)
		else:
			world.audio.sfx("shield"); world.fx.block(cx + facing * 8, cy - 2, -facing)
			poise -= box.get("poise", 10.0) * 0.5
			if poise <= 0:
				poise = poise_max; do_stagger(0.6, false)
			return true
	var dmg: float = box["dmg"] * damage_mult(box)
	if stagger > 0 and parried:
		dmg *= 1.5
	hp -= dmg
	flash = 0.16
	last_hit_t = 0.0
	aggro = true
	var heavy: bool = box.get("kind", "") in ["heavy", "riposte"]
	var mat: String = MATS.get(kind, {}).get("mat", "flesh")
	world.audio.sfx("hit_heavy" if heavy else "hit")
	world.audio.sfx({"armor": "hit_metal", "stone": "hit_stone", "spirit": "hit_spirit", "wax": "hit_soft", "wood": "hit_wood"}.get(mat, "enemy_hurt"), 0.5)
	if is_boss():
		world.audio.sfx("boss_hit", 0.75 if heavy else 0.55)   # peso extra num chefe
	world.hitstop(box.get("hitstop", 0.085 if heavy else 0.05))
	world.shake((0.24 if heavy else 0.1) * (1.15 if is_boss() else 1.0))
	var src = box.get("src")
	var kx: float = signf(cx - src.cx) if src != null and is_instance_valid(src) and src.cx != cx else 1.0
	# ponto de contacto: entre a ponta da arma e o centro do alvo
	var hx: float = clampf(box["tip"].x, pos.x + 2, pos.x + size.x - 2) if box.has("tip") else cx - kx * 4
	var hy: float = clampf(box["tip"].y, pos.y + 3, pos.y + size.y - 3) if box.has("tip") else cy - 2
	world.fx.hit_fx({"x": hx, "y": hy, "mat": mat, "ang": box.get("cut_a", 0.0 if kx > 0 else PI), "dir": kx, "power": 1.5 if heavy else 1.0, "heavy": heavy})
	if hp <= 0:
		die(); return true
	poise -= box.get("poise", 10.0)
	var armor: bool = not atk.is_empty() and atk["s"].get("armor", false) and atk["phase"] != "rec"
	if (not is_heavy() or heavy) and not armor:
		vel.x = kx * box.get("knock", 150.0) * (0.4 if is_heavy() else 1.0)
	if poise <= 0 and not armor:
		poise = poise_max; do_stagger(0.55, false)
	elif not armor and not is_heavy() and not atk.is_empty() and atk["phase"] == "wind":
		atk = {}; cool = 0.4
	return true

func is_boss() -> bool:
	return false

func damage_mult(_box: Dictionary) -> float:
	return 1.0

func is_heavy() -> bool:
	return K.get("heavy", false)

func do_stagger(dur: float, from_parry: bool) -> void:
	stagger = dur; atk = {}; parried = from_parry
	if from_parry:
		world.audio.sfx("stagger")
		world.fx.stun_at(cx, pos.y + 2)

func on_parried() -> void:
	do_stagger(1.3, true)
	vel.x = facing * -120.0

func is_fire_source() -> bool:
	return false

func die() -> void:
	if dead:
		return
	dead = true; hittable = false; atk = {}; contact_dmg = 0.0; _death_t = 0.0
	GameState.ash += ash_drop
	world.fx.ash_orbs(Vector2(cx, cy), mini(6, maxi(1, ceili(ash_drop / 8.0))))
	world.audio.sfx("enemy_die")
	world.shake(0.15)

# ------------------------------------------------------------------ desenho
func current_frame() -> Dictionary:
	if sh.is_empty():
		return {}
	var A: Dictionary = sh["meta"]["anims"]
	if dead:
		return Data.frame(sh, "death", (t - (t - anim)) * 0 + _death_k())
	if stagger > 0 and A.has("stagger"):
		return _timed("stagger")
	if not atk.is_empty():
		var an := "atk_" + String(atk["name"])
		if A.has(an):
			var s: Dictionary = atk["s"]
			var d: float = s[atk["phase"]]
			return Data.phase_frame(sh, an, atk["phase"], atk["t"] / maxf(0.001, d))
	if last_hit_t < 0.22 and A.has("hurt"):
		return Data.frame(sh, "hurt", (last_hit_t / 0.22) * A["hurt"]["frames"].size())
	if (flying or absf(vel.x) > 6) and A.has("move"):
		var mv: Dictionary = A["move"]
		if mv.get("stride", 0.0) > 0 and not flying:
			return Data.frame(sh, "move", (_dist / float(mv["stride"])) * mv["frames"].size())
		return _timed("move")
	return _timed("idle")

var _death_t := 0.0
var _dist := 0.0
## material e cor da cinza (VS.NATURE e cfg.ashCol do jogo web)
const MATS := {"husk": {"mat": "ash"}, "husk_big": {"mat": "ash"}, "crawler": {"mat": "ash", "ashCol": "#ff6010"},
	"wisp": {"mat": "wax", "ashCol": "#ffb040"}, "sexton": {"mat": "flesh"}, "coveiro": {"mat": "flesh", "ashCol": "#7a6a58"}}
func _death_k() -> float:
	return _death_t * float(sh["meta"]["anims"].get("death", {"fps": 8})["fps"])

func _timed(an: String) -> Dictionary:
	if an != anim_key:
		anim_key = an; anim_kt = 0.0
	return Data.frame(sh, an, anim_kt * float(sh["meta"]["anims"][an]["fps"]))

func _process(delta: float) -> void:
	anim_kt += delta
	if K.get("center", false):
		position = draw_anchor(size / 2.0)
	else:
		position = draw_anchor(Vector2(size.x / 2.0, size.y))
	if eye_light:
		var f := current_frame()
		var e = Data.point(f, "eye")
		eye_light.position = Vector2(e.x * facing, e.y) if e != null else Vector2(0, -size.y * 0.8)
		eye_light.enabled = not dead
	queue_redraw()
	fx_add.queue_redraw()

func tell_glow() -> Color:
	if atk.is_empty() or atk["phase"] != "wind":
		return Color(0, 0, 0, 0)
	var s: Dictionary = atk["s"]
	var left: float = s["wind"] - atk["t"]
	if s.get("tell", "") == "white" and left <= TELL_LEAD:
		return Color(1, 0.95, 0.85, 0.85)
	if s.get("tell", "") == "red":
		return Color(1, 0.15, 0.1, 0.85)
	return Color(0, 0, 0, 0)

func _draw() -> void:
	if sh.is_empty():
		draw_rect(Rect2(-size.x / 2, -size.y, size.x, size.y), Color(0.3, 0.3, 0.35))
		return
	var f := current_frame()
	var mod := Color.WHITE
	draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
	Data.draw_frame(self, sh, f, mod)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

## ponto do fotograma em coordenadas deste nó (a âncora é a origem)
func _pt(f: Dictionary, which: String) -> Variant:
	var p = Data.point(f, which)
	if p == null:
		return null
	return Vector2(p.x * facing, p.y)

func _anchor_y() -> float:
	return cy if K.get("center", false) else bottom

func _glow(at: Vector2, r: float, c: Color) -> void:
	fx_add.draw_texture_rect(_radial, Rect2(at - Vector2(r, r), Vector2(r, r) * 2.0), false, c)

func _draw_add() -> void:
	if sh.is_empty():
		return
	var f := current_frame()
	# clarão de dano: o mesmo fotograma por cima, aditivo a 0,75 (Assets.drawFlash)
	if flash > 0 and not dead:
		fx_add.draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
		Data.draw_frame(fx_add, sh, f, Color(1, 1, 1, 0.75))
		fx_add.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
	_draw_smear(f)
	if dead or atk.is_empty() or atk["phase"] != "wind" or not Settings.get_v("telegraphs"):
		return
	var st: Dictionary = atk["s"]
	var kind_t: String = st.get("tell", "")
	if kind_t == "":
		return
	var k: float = atk["t"] / maxf(0.001, st["wind"])
	var left: float = st["wind"] - atk["t"]
	var tip = _pt(f, "tip")
	var pt: Vector2 = tip if tip != null else Vector2(facing * size.x * 0.6, (pos.y + 6) - _anchor_y())
	if kind_t == "white":
		# brilho branco na ponta: aparece 0,42 s antes do golpe (ER.tell)
		if left < 0.42:
			var q := 1.0 - left / 0.42
			var a := (q / 0.5 if q < 0.5 else 1.0 - (q - 0.5) * 1.2) * 0.95
			var r := 4.0 + q * 9.0
			_glow(pt, r * 1.6 * 0.55, Color(1, 1, 0.98, a))
			_glow(pt, r * 1.6, Color(1, 0.92, 0.78, a * 0.45))
			# reflexo de metal: raios finos e afunilados
			var rot := -0.12 + q * 0.2
			_ray(pt, rot, r * 1.7, 0.8, Color(1, 1, 1, a))
			_ray(pt, rot + PI / 2, r * 0.35, 0.5, Color(1, 0.98, 0.92, a * 0.6))
	elif kind_t == "red":
		# brasa vermelha a pulsar: não se apara, esquiva-se
		var pulse := 0.55 + 0.45 * sin(t * 26.0)
		_glow(Vector2(0, cy - _anchor_y()), size.x + 16.0, Color(1, 0.16, 0.08, 0.22 * k))
		var eye = _pt(f, "eye")
		var ep: Vector2 = eye if eye != null else pt
		var rr := 8.0 + 6.0 * k
		_glow(ep, rr * 0.4, Color(1, 0.86, 0.78, 0.9 * pulse))
		_glow(ep, rr, Color(1, 0.2, 0.12, 0.7 * pulse))

func _ray(at: Vector2, rot: float, ln: float, w: float, c: Color) -> void:
	var pts := PackedVector2Array()
	var d := Vector2(cos(rot), sin(rot)); var n := Vector2(-d.y, d.x)
	for i in 9:
		var u := i / 8.0
		var x := lerpf(-ln, ln, u)
		pts.append(at + d * x - n * w * 2.0 * u * (1.0 - u) * 2.0)
	for i in range(8, -1, -1):
		var u := i / 8.0
		var x := lerpf(-ln, ln, u)
		pts.append(at + d * x + n * w * 2.0 * u * (1.0 - u) * 2.0)
	if not Geometry2D.triangulate_polygon(pts).is_empty():
		fx_add.draw_colored_polygon(pts, c)

## rasto da arma durante o golpe: crescente curvo à volta do punho (ER.smear)
func _draw_smear(f: Dictionary) -> void:
	if atk.is_empty() or atk["phase"] != "act" or dead:
		_sm = {}; return
	var g = _pt(f, "grip"); var tp = _pt(f, "tip")
	if g == null or tp == null:
		_sm = {}; return
	var ang := atan2(tp.y - g.y, tp.x - g.x)
	var r: float = (tp - g).length()
	if _sm.is_empty() or _sm["id"] != atk["id"]:
		_sm = {"f": f, "a0": ang, "a1": ang, "id": atk["id"]}
	if _sm["f"] != f:
		_sm["a0"] = _sm["a1"]; _sm["a1"] = ang; _sm["f"] = f
	var dd: float = wrapf(_sm["a1"] - _sm["a0"], -PI, PI)
	if absf(dd) < 0.25 or r < 12:
		return
	var n := 14; var r0 := r * 0.7
	var pts := PackedVector2Array(); var cols := PackedColorArray()
	for i in n + 1:
		var kk := float(i) / n; var aa: float = _sm["a0"] + dd * kk; var rr := r * (0.94 + 0.06 * kk)
		pts.append(g + Vector2(cos(aa), sin(aa)) * rr); cols.append(Color(1, 0.96, 0.9, 0.6 * kk + 0.12))
	for i in range(n, -1, -1):
		var kk := float(i) / n; var aa: float = _sm["a0"] + dd * kk; var ri := r - (r - r0) * kk * kk
		pts.append(g + Vector2(cos(aa), sin(aa)) * ri); cols.append(Color(1, 0.92, 0.78, 0.0))
	if not Geometry2D.triangulate_polygon(pts).is_empty():
		fx_add.draw_polygon(pts, cols)
