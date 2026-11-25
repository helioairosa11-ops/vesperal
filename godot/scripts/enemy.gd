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
	sh = Data.sheet(K.get("sheet", "en_" + k))

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
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
		world.audio.sfx("danger")

# ------------------------------------------------------------------ ciclo
func tick(dt: float) -> void:
	super.tick(dt)
	anim += dt
	last_hit_t += dt
	attack_boxes.clear()
	if dead:
		vel.x = move_toward(vel.x, 0, 600 * dt)
		physics(dt, flying)
		return
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
				cool = randf_range(0.4, 1.0)

func _on_act(nm: String, s: Dictionary) -> void:
	if s.get("shake", 0.0) > 0:
		world.shake(s["shake"]); world.audio.sfx("crush")
		world.fx.dust(Vector2(cx + facing * 26, bottom), 10)
	else:
		world.audio.sfx("swing_enemy")
	if kind == "wisp" and nm == "spit":
		var a := (Vector2(player.cx, player.cy) - Vector2(cx, cy)).normalized()
		world.spawn_projectile({"pos": Vector2(cx, cy), "vel": a * 150.0, "size": Vector2(9, 9), "dmg": 10.0, "kind": "fire", "fire": true, "life": 3.0})
	if kind == "wisp" and nm == "dive":
		var a2 := (Vector2(player.cx, player.cy) - Vector2(cx, cy)).normalized()
		vel = a2 * 260.0

func _during(_name: String, _s: Dictionary, _dt: float) -> void:
	pass

func _on_end(nm: String) -> void:
	if kind == "crawler" and nm == "bite":
		vel.x = -facing * 110.0
	if kind == "wisp":
		vel *= 0.3

func _think_husk(dt: float) -> void:
	if not atk.is_empty():
		return
	if sees(170):
		aggro = true
	if aggro and absf(dy()) < 100:
		face()
		var d := absf(dx())
		if d < 34 and cool <= 0:
			attack("lunge" if randf() < 0.3 else "swing")
		elif d > 26:
			walk(facing, 48, dt)
		else:
			walk(0, 0, dt)
		if d > 320:
			aggro = false
	else:
		mode_t -= dt
		if mode_t <= 0:
			mode_t = randf_range(1.5, 3.5); wander = [-1, 0, 1].pick_random()
			if wander != 0:
				facing = wander
		if not walk(wander, 22, dt):
			wander = -(wander if wander != 0 else 1)

func _think_crawler(dt: float) -> void:
	if not atk.is_empty():
		return
	if sees(200, 60):
		aggro = true
	surge_t -= dt
	if surge_t <= 0:
		surging = not surging
		surge_t = randf_range(0.28, 0.42) if surging else randf_range(0.14, 0.3)
	if aggro:
		face()
		var d := absf(dx())
		if cool <= 0 and on_ground:
			if d < 26:
				attack("bite"); return
			if d > 44 and d < 92 and absf(dy()) < 30:
				attack("pounce"); vel.y = -160; return
		walk(0 if d < 22 else facing, 118.0 if surging else 10.0, dt)
		if d > 320:
			aggro = false
	elif not walk(facing, 46.0 if surging else 0.0, dt):
		facing *= -1

func _think_wisp(dt: float) -> void:
	if sees(230, 160):
		aggro = true
	if not atk.is_empty():
		if atk["name"] != "dive" or atk["phase"] == "rec":
			vel *= 0.92
		return
	if aggro:
		var side := -1 if player.cx > cx else 1
		fly_to(Vector2(player.cx + side * 90, player.cy - 60 + sin(anim * 2.0) * 20.0), 80, dt)
		if cool <= 0:
			var d := Vector2(player.cx - cx, player.cy - cy).length()
			attack("dive" if d < 120 and randf() < 0.45 else "spit")
		face()
	else:
		vel = vel.lerp(Vector2(sin(anim) * 12.0, cos(anim * 1.3) * 8.0), 0.05)

func _think_sexton(dt: float) -> void:
	if not atk.is_empty():
		return
	if sees(200):
		aggro = true
	if aggro:
		face()
		var d := absf(dx())
		if d < 22 and cool < 0.6:
			walk(-facing, 55, dt); return
		if d < 54 and cool <= 0:
			attack("slam" if absf(player.vel.x) < 20 and randf() < 0.55 else "sweep")
		elif d > 40:
			walk(facing, 40, dt)
		else:
			walk(0, 0, dt)

# ------------------------------------------------------------------ dano
func on_hit(box: Dictionary) -> bool:
	if dead or not hittable:
		return false
	var dmg: float = box["dmg"] * damage_mult(box)
	if stagger > 0 and parried:
		dmg *= 1.5
	hp -= dmg
	flash = 0.12
	last_hit_t = 0.0
	poise -= box.get("knock", 100.0) / 10.0
	var kb: float = box.get("knock", 120.0)
	if not is_heavy():
		vel.x = signf(cx - box["src"].cx) * kb * 0.6
	if poise <= 0 and not is_heavy():
		poise = poise_max; do_stagger(0.55, false)
	elif not is_heavy() and not atk.is_empty() and atk["phase"] == "wind":
		atk = {}; cool = 0.4
	world.fx.hit(Vector2(cx, cy - size.y * 0.1), -signf(box["src"].cx - cx))
	world.audio.sfx("hit")
	if hp <= 0:
		die()
	return true

func damage_mult(_box: Dictionary) -> float:
	return 1.0

func is_heavy() -> bool:
	return false

func do_stagger(dur: float, from_parry: bool) -> void:
	stagger = dur; atk = {}; parried = from_parry
	if from_parry:
		world.fx.stun(Vector2(cx, pos.y - 6))

func on_parried() -> void:
	do_stagger(1.3, true)
	vel.x = facing * -120.0

func is_fire_source() -> bool:
	return false

func die() -> void:
	if dead:
		return
	dead = true; hittable = false; atk = {}
	GameState.ash += ash_drop
	world.fx.burst(Vector2(cx, cy), 20, Color(0.75, 0.68, 0.62), 90.0)
	world.fx.ash_orbs(Vector2(cx, cy), 5)
	world.audio.sfx("kill")
	get_tree().create_timer(1.6).timeout.connect(func(): if is_instance_valid(self): queue_free())

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
		return _timed("move")
	return _timed("idle")

var _death_t := 0.0
func _death_k() -> float:
	return _death_t * float(sh["meta"]["anims"].get("death", {"fps": 8})["fps"])

func _timed(an: String) -> Dictionary:
	if an != anim_key:
		anim_key = an; anim_kt = 0.0
	return Data.frame(sh, an, anim_kt * float(sh["meta"]["anims"][an]["fps"]))

func _process(delta: float) -> void:
	anim_kt += delta
	if dead:
		_death_t += delta
	if K.get("center", false):
		position = Vector2(cx, cy)
	else:
		position = Vector2(cx, bottom)
	if eye_light:
		var f := current_frame()
		var e = Data.point(f, "eye")
		eye_light.position = Vector2(e.x * facing, e.y) if e != null else Vector2(0, -size.y * 0.8)
		eye_light.enabled = not dead
	queue_redraw()

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
	if flash > 0:
		mod = Color(3.0, 2.6, 2.4)
	if dead and not is_heavy():
		mod.a = clampf(1.6 - _death_t, 0, 1)
	var g := tell_glow()
	if g.a > 0:
		# aviso do golpe: brilho branco (aparável) ou vermelho (esquiva)
		var c := Vector2(0, -size.y * 0.6)
		for i in 3:
			draw_circle(c, 10.0 + i * 6.0, Color(g, 0.12 - i * 0.03))
	draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
	Data.draw_frame(self, sh, f, mod)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
