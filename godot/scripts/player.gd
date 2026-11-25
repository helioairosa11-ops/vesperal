extends Actor
## O Desperto: movimento, combo de espada, esquiva, aparo, cura, queimadura. Valores iguais aos do jogo web.

const C := {
	"RUN": 160.0, "ACC_G": 1700.0, "ACC_A": 1350.0, "FRIC": 2100.0,
	"GRAV": 1350.0, "FALL_MUL": 1.2, "MAXFALL": 480.0, "JUMP": -452.0, "JUMP_CUT": 0.42, "DOUBLE": -412.0,
	"COYOTE": 0.12, "JUMP_BUF": 0.15, "WALL_SLIDE": 70.0, "WALL_JVX": 240.0, "WALL_JVY": -430.0, "WALL_LOCK": 0.16,
	"PARRY": 0.2, "PARRY_LATE": 0.07, "IFRAMES": 0.9,
}
# golpes: tempos (s), alcance e caixa; anim = animação da folha hero2_espada
const ATK := {
	"l1": {"wind": 0.07, "act": 0.09, "rec": 0.2, "mult": 1.0, "lunge": 120.0, "knock": 150.0, "next": "l2", "box": [6, 4, 40, 34]},
	"l2": {"wind": 0.06, "act": 0.09, "rec": 0.22, "mult": 1.0, "lunge": 110.0, "knock": 150.0, "next": "l3", "box": [6, 4, 40, 34]},
	"l3": {"wind": 0.13, "act": 0.1, "rec": 0.32, "mult": 1.35, "lunge": 170.0, "knock": 260.0, "hitstop": 0.075, "box": [4, 0, 48, 42]},
	"air": {"wind": 0.05, "act": 0.09, "rec": 0.15, "mult": 1.0, "knock": 120.0, "next": "air2", "box": [4, 2, 40, 38]},
	"air2": {"wind": 0.05, "act": 0.09, "rec": 0.2, "mult": 1.0, "knock": 120.0, "box": [4, 2, 40, 38]},
	"up": {"wind": 0.06, "act": 0.1, "rec": 0.2, "mult": 1.0, "knock": 100.0, "box": [-22, 26, 44, 40]},
	"down": {"wind": 0.04, "act": 0.13, "rec": 0.15, "mult": 1.0, "knock": 80.0, "pogo": true, "box": [-18, -30, 36, 34]},
	"crouch": {"wind": 0.05, "act": 0.08, "rec": 0.2, "mult": 0.9, "knock": 120.0, "box": [6, 0, 42, 16]},
	"riposte": {"wind": 0.05, "act": 0.11, "rec": 0.3, "mult": 2.2, "knock": 320.0, "hitstop": 0.16, "lunge": 260.0, "box": [4, 4, 48, 34], "kind": "riposte"},
}
const BASE_DMG := 14.0

var sh: Dictionary
var shw: Dictionary
var action: Dictionary = {}
var coyote := 0.0
var jump_buf := 0.0
var attack_buf := 0.0
var double_used := false
var air_dash := false
var iframes := 0.0
var dodge_cd := 0.0
var riposte_t := 0.0
var combo := ""
var combo_t := 0.0
var crouch := false
var wall_dir := 0
var wall_lock := 0.0
var burn := {}
var anim_key := "idle"
var anim_t := 0.0
var land_t := 0.0
var air_t := 0.0
var afterimages: Array = []
var parry_flash := 0.0
var heal_glow := 0.0
var pending_hit: Dictionary = {}
var light: PointLight2D

func _ready() -> void:
	team = "player"
	size = Vector2(12, 30)
	gravity = C["GRAV"]; max_fall = C["MAXFALL"]
	max_hp = GameState.max_hp; hp = GameState.hp
	sh = Data.sheet("hero2"); shw = Data.sheet("hero2_espada")
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	# a brasa no peito: luz quente que acompanha a protagonista
	light = PointLight2D.new()
	light.texture = world.light_tex
	light.color = Color(1.0, 0.62, 0.3)
	light.energy = 1.1
	light.texture_scale = 0.9
	light.position = Vector2(0, -19)
	add_child(light)

func busy() -> bool:
	return not action.is_empty()

func can_act() -> bool:
	if action.is_empty():
		return true
	var ph: String = action.get("phase", "")
	return ph == "rec" and action["t"] > action.get("rec", 0.2) * 0.2

func tick(dt: float) -> void:
	super.tick(dt)
	iframes = maxf(0.0, iframes - dt)
	dodge_cd = maxf(0.0, dodge_cd - dt)
	riposte_t = maxf(0.0, riposte_t - dt)
	combo_t = maxf(0.0, combo_t - dt)
	wall_lock = maxf(0.0, wall_lock - dt)
	parry_flash = maxf(0.0, parry_flash - dt * 3.0)
	heal_glow = maxf(0.0, heal_glow - dt)
	jump_buf = maxf(0.0, jump_buf - dt)
	attack_buf = maxf(0.0, attack_buf - dt)
	land_t = maxf(0.0, land_t - dt)
	attack_boxes.clear()
	_update_burn(dt)
	if dead:
		action["t"] = action.get("t", 0.0) + dt
		vel.x = move_toward(vel.x, 0, C["FRIC"] * dt)
		physics(dt)
		return
	# golpe à espera: aparo tardio (até 0,07 s depois)
	if not pending_hit.is_empty():
		pending_hit["t"] -= dt
		if Input.is_action_just_pressed("parry"):
			_parried(pending_hit["box"])
			pending_hit = {}
		elif pending_hit["t"] <= 0:
			var b: Dictionary = pending_hit["box"]
			pending_hit = {}
			_take_damage(b)
	if Input.is_action_just_pressed("jump"):
		jump_buf = C["JUMP_BUF"]
	if Input.is_action_just_pressed("attack"):
		attack_buf = 0.12
	var ax := Input.get_axis("left", "right")
	ax = signf(ax)
	var up := Input.is_action_pressed("up")
	var down := Input.is_action_pressed("down")
	if ax != 0 and wall_lock <= 0 and (action.is_empty() or action.get("can_turn", false)):
		facing = int(ax)
	crouch = on_ground and down and action.is_empty()
	# ---- iniciar ações
	if Input.is_action_just_pressed("parry") and (action.is_empty() or can_act()):
		_start_parry()
	elif action.is_empty() or can_act():
		_try_actions(ax, up, down)
	# ---- movimento horizontal
	var speed: float = C["RUN"] * (0.0 if crouch else 1.0)
	var target := ax * speed
	var acc: float = C["ACC_G"] if on_ground else C["ACC_A"]
	if not action.is_empty():
		match action["type"]:
			"dodge":
				target = vel.x; acc = 0.0
			"attack":
				if on_ground:
					var late: bool = action["phase"] == "rec" and action["t"] > action["rec"] * 0.3
					target = action.get("lunge_v", 0.0) + ax * speed * (0.8 if late else 0.3)
					acc = C["ACC_G"] if late else C["FRIC"] * 1.2
				else:
					target = ax * speed * 0.9
			"heal":
				target = ax * speed * 0.25
			"parry":
				target = 0.0 if on_ground else vel.x; acc = C["FRIC"]
			"hurt":
				target = vel.x; acc = 500.0
	if wall_lock > 0:
		acc = 0.0
	if acc > 0:
		var a2: float = C["FRIC"] if (ax == 0 and on_ground and action.is_empty()) else acc
		vel.x = move_toward(vel.x, target, a2 * dt)
	# ---- gravidade, parede
	var grav: float = C["GRAV"]
	max_fall = C["MAXFALL"]
	if action.get("type", "") == "dodge" and action.get("air", false):
		grav = 0.0
	wall_dir = 0
	if not on_ground and ax != 0 and vel.y > 0 and action.is_empty():
		var probe := Rect2(pos + Vector2(ax * 2, 2), size - Vector2(0, 8))
		if world.room.rect_solid(probe):
			wall_dir = int(ax)
			max_fall = C["WALL_SLIDE"]
	if vel.y > 0 and max_fall != C["WALL_SLIDE"] and action.get("type", "") != "dodge":
		grav *= C["FALL_MUL"]
	gravity = grav
	# ---- salto
	coyote = C["COYOTE"] if on_ground else maxf(0.0, coyote - dt)
	if on_ground:
		double_used = false; air_dash = false
	if jump_buf > 0 and (action.is_empty() or action.get("type", "") in ["attack"] and action["phase"] == "rec"):
		if on_ground and down and _on_platform():
			drop_through = true; jump_buf = 0
			get_tree().create_timer(0.25).timeout.connect(func(): drop_through = false)
		elif coyote > 0:
			_jump(C["JUMP"]); coyote = 0
		elif wall_dir != 0:
			vel.x = -wall_dir * C["WALL_JVX"]; facing = -wall_dir; wall_lock = C["WALL_LOCK"]
			_jump(C["WALL_JVY"])
		elif GameState.abilities.get("double", false) and not double_used:
			double_used = true; _jump(C["DOUBLE"])
			world.fx.burst(Vector2(cx, bottom), 10, Color(1, 0.8, 0.55), 90.0)
	if Input.is_action_just_released("jump") and vel.y < 0:
		vel.y *= C["JUMP_CUT"]
	var was_ground := on_ground
	var fall_v := vel.y
	var res := physics(dt)
	if res["landed"] and not was_ground and fall_v > 200:
		land_t = 0.18
		world.fx.dust(Vector2(cx, bottom), 6 + int(fall_v / 80.0))
	air_t = 0.0 if on_ground else air_t + dt
	_update_action(dt)
	# perigos (espinhos, lava)
	var tx := floori(cx / 20.0)
	var ty := floori((bottom - 2) / 20.0)
	if world.room.is_hazard(tx, ty) and iframes <= 0:
		_take_damage({"dmg": 20.0, "knock": 200.0, "src": null, "unblockable": true})
	# rasto da esquiva
	for g in afterimages:
		g["a"] -= dt * 3.0
	afterimages = afterimages.filter(func(g): return g["a"] > 0)

func _on_platform() -> bool:
	var ty := floori((bottom + 1) / 20.0)
	return world.room.is_platform(floori(cx / 20.0), ty)

func _jump(v: float) -> void:
	vel.y = v; jump_buf = 0; on_ground = false
	world.audio.sfx("jump")
	if action.get("type", "") == "attack":
		action = {}

func _try_actions(ax: float, up: bool, down: bool) -> void:
	if Input.is_action_just_pressed("heal") and on_ground:
		_start_heal(); return
	if Input.is_action_just_pressed("dodge") and dodge_cd <= 0:
		if on_ground or not air_dash:
			_start_dodge(ax); return
	if not action.is_empty() and action.get("phase", "") != "rec":
		return
	if attack_buf > 0:
		attack_buf = 0
		if ax != 0:
			facing = int(ax)
		var nm := ""
		if riposte_t > 0:
			nm = "riposte"
		elif not on_ground and down:
			nm = "down"
		elif up:
			nm = "up"
		elif crouch:
			nm = "crouch"
		elif not on_ground:
			nm = ATK[combo]["next"] if combo == "air" and combo_t > 0 else "air"
		else:
			nm = ATK[combo]["next"] if combo in ["l1", "l2"] and combo_t > 0 else "l1"
		_start_attack(nm)

func _start_attack(nm: String) -> void:
	var d: Dictionary = ATK[nm]
	action = {"type": "attack", "name": nm, "phase": "wind", "t": 0.0, "wind": d["wind"], "act": d["act"], "rec": d["rec"], "id": Actor.new_attack_id(), "can_turn": false}
	combo = nm; combo_t = d["wind"] + d["act"] + d["rec"] + 0.25
	if nm == "riposte":
		riposte_t = 0

func _start_dodge(ax: float) -> void:
	var air := not on_ground
	if ax != 0:
		facing = int(ax)
	action = {"type": "dodge", "t": 0.0, "dur": 0.2 if air else 0.34, "air": air}
	if air:
		air_dash = true; vel.y = 0
	vel.x = facing * (300.0 if air else 270.0)
	iframes = maxf(iframes, 0.24)
	dodge_cd = 0.32
	world.audio.sfx("dodge")
	world.fx.dust(Vector2(cx, bottom), 6)

func _start_parry() -> void:
	action = {"type": "parry", "t": 0.0, "phase": "act", "window": C["PARRY"], "dur": 0.38, "success": false, "can_turn": true}
	if not pending_hit.is_empty():
		_parried(pending_hit["box"]); pending_hit = {}

func _start_heal() -> void:
	if GameState.flasks <= 0:
		world.toast("Sem frascos de cinza."); return
	action = {"type": "heal", "t": 0.0, "dur": 0.85, "done": false}

func _update_action(dt: float) -> void:
	if action.is_empty():
		return
	action["t"] += dt
	match action["type"]:
		"attack":
			var d: Dictionary = ATK[action["name"]]
			if action["phase"] == "wind" and action["t"] >= action["wind"]:
				action["phase"] = "act"; action["t"] = 0.0
				action["lunge_v"] = facing * d.get("lunge", 0.0) if on_ground else 0.0
				world.audio.sfx("swing")
			elif action["phase"] == "act":
				var b: Array = d["box"]
				var r: Rect2
				if action["name"] == "up":
					r = Rect2(cx + b[0], pos.y - b[1] - b[3] + 30, b[2], b[3])
				elif action["name"] == "down":
					r = Rect2(cx + b[0], bottom + b[1] + b[3] - 34, b[2], b[3])
				else:
					r = front(b[0], b[1], b[2], b[3])
				attack_boxes.append({"rect": r, "dmg": BASE_DMG * d["mult"], "id": action["id"], "knock": d["knock"], "kind": d.get("kind", "slash"), "pogo": d.get("pogo", false), "hitstop": d.get("hitstop", 0.05), "src": self})
				if action["t"] >= action["act"]:
					action["phase"] = "rec"; action["t"] = 0.0; action["lunge_v"] = 0.0
			elif action["phase"] == "rec" and action["t"] >= action["rec"]:
				action = {}
		"dodge":
			if action.get("air", false):
				vel.y = 0
			if fmod(action["t"], 0.05) < dt:
				afterimages.append({"p": Vector2(cx, bottom), "f": facing, "fr": _current_frame(), "a": 0.7})
			if action["t"] >= action["dur"]:
				vel.x *= 0.45; action = {}
		"parry":
			if action["t"] >= action["dur"]:
				action = {}
		"heal":
			if not action["done"] and action["t"] >= action["dur"] * 0.6:
				action["done"] = true
				GameState.flasks -= 1
				hp = minf(max_hp, hp + round(max_hp * 0.45)); GameState.hp = int(hp)
				heal_glow = 0.8; burn = {}
				world.fx.burst(Vector2(cx, cy), 18, Color(1, 0.75, 0.4), 70.0, true)
				world.audio.sfx("heal")
			if action["t"] >= action["dur"]:
				action = {}
		"hurt":
			if action["t"] >= 0.32:
				action = {}

## um golpe inimigo chegou: aparo, esquiva, ou dano
func receive(box: Dictionary) -> void:
	if dead or iframes > 0:
		return
	if action.get("type", "") == "dodge":
		return
	var parryable: bool = box.get("parryable", true) and not box.get("unblockable", false)
	if action.get("type", "") == "parry" and action["t"] <= action["window"] and parryable:
		_parried(box); return
	if parryable and pending_hit.is_empty():
		pending_hit = {"t": C["PARRY_LATE"], "box": box}
		return
	_take_damage(box)

func _parried(box: Dictionary) -> void:
	action = {"type": "parry", "t": 0.0, "phase": "act", "window": 0.0, "dur": 0.3, "success": true, "can_turn": false}
	riposte_t = 0.9
	parry_flash = 1.0
	iframes = maxf(iframes, 0.2)
	var src = box.get("src")
	var p := Vector2(cx + facing * 14, cy - 4)
	world.fx.sparks(p, 22)
	world.hitstop(0.12)
	world.shake(0.25)
	world.audio.sfx("parry")
	if src != null and is_instance_valid(src) and src.has_method("on_parried") and not box.get("projectile", false):
		src.on_parried()
	elif box.get("projectile", false) and src != null and is_instance_valid(src):
		src.queue_free_safe()

func is_fire(box: Dictionary) -> bool:
	if box.get("fire", false):
		return true
	var src = box.get("src")
	return src != null and is_instance_valid(src) and src.has_method("is_fire_source") and src.is_fire_source()

func _take_damage(box: Dictionary) -> void:
	if dead or iframes > 0:
		return
	var dmg: float = box.get("dmg", 10.0)
	hp = maxf(0.0, hp - dmg); GameState.hp = int(hp)
	flash = 0.15
	iframes = C["IFRAMES"]
	var src = box.get("src")
	var dir := -facing
	if src != null and is_instance_valid(src):
		dir = 1 if cx >= src.cx else -1
	vel = Vector2(dir * box.get("knock", 160.0), -200)
	action = {"type": "hurt", "t": 0.0}
	world.fx.blood(Vector2(cx, cy), 12, dir)
	world.hitstop(0.08); world.shake(0.3)
	world.audio.sfx("hurt")
	if hp <= 0:
		_die(); return
	if is_fire(box):
		burn = {"t": 3.0, "tick": 0.6}

func _update_burn(dt: float) -> void:
	if burn.is_empty() or dead:
		return
	var k := 3.0 if action.get("type", "") == "dodge" else 1.0
	burn["t"] -= dt * k
	burn["tick"] -= dt
	if randf() < 0.5:
		world.fx.ember(Vector2(cx + randf_range(-6, 6), pos.y + randf_range(4, 26)))
	if burn["tick"] <= 0:
		burn["tick"] = 0.6
		if hp > 1:
			hp = maxf(1.0, hp - 3.0); GameState.hp = int(hp); flash = 0.06
	if burn["t"] <= 0:
		burn = {}

func _die() -> void:
	dead = true
	action = {"type": "dead", "t": 0.0}
	world.on_player_dead()

func on_hit_enemy(box: Dictionary) -> void:
	if box.get("pogo", false):
		vel.y = -380; double_used = false; air_dash = false
		action = {}

# ------------------------------------------------------------------ desenho
func _current_frame() -> Dictionary:
	var k := anim_key
	if action.get("type", "") == "attack":
		var nm: String = action["name"]
		var d: float = action[action["phase"]]
		var a: Dictionary = shw["meta"]["anims"][nm]
		var n: int = a["frames"].size()
		# wind = primeiro terço, act = meio, rec = resto
		var i0 := 0.0; var i1 := n * 0.3
		if action["phase"] == "act":
			i0 = n * 0.3; i1 = n * 0.6
		elif action["phase"] == "rec":
			i0 = n * 0.6; i1 = n
		return Data.frame(shw, nm, i0 + (i1 - i0) * clampf(action["t"] / maxf(d, 0.001), 0, 0.999))
	if action.get("type", "") == "parry":
		return Data.frame(shw, "parry", action["t"] * 18.0)
	return Data.frame(sh, k, anim_t * float(sh["meta"]["anims"][k]["fps"]))

func _pick_anim(dt: float) -> void:
	var k := "idle"
	var tp: String = action.get("type", "")
	if dead:
		k = "death"
	elif tp == "dodge":
		k = "airdash" if action.get("air", false) else "dodge"
	elif tp == "hurt":
		k = "hurt"
	elif tp == "heal":
		k = "heal"
	elif not on_ground:
		if wall_dir != 0:
			k = "wall"
		elif vel.y < -60:
			k = "double" if double_used else "jump"
		elif vel.y < 60:
			k = "apex"
		else:
			k = "fall"
	elif crouch:
		k = "crawl" if absf(vel.x) > 10 else "crouchIdle"
	elif land_t > 0:
		k = "land"
	elif absf(vel.x) > 120:
		k = "run"
	elif absf(vel.x) > 12:
		k = "walk"
	if k != anim_key:
		anim_key = k; anim_t = 0.0
	else:
		anim_t += dt

func _process(delta: float) -> void:
	_pick_anim(delta)
	sync_node()
	light.energy = 1.0 + 0.15 * sin(t * 7.0) + heal_glow + parry_flash * 0.8

func _draw() -> void:
	if sh.is_empty():
		return
	# rasto fantasma da esquiva
	for g in afterimages:
		draw_set_transform(g["p"] - position, 0, Vector2(g["f"], 1))
		Data.draw_frame(self, sh if not g["fr"].is_empty() and action.get("type", "") != "attack" else sh, g["fr"], Color(0.45, 0.55, 1.0, g["a"] * 0.45))
	draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
	var f := _current_frame()
	var useweapon: bool = action.get("type", "") in ["attack", "parry"]
	var mod := Color.WHITE
	if flash > 0:
		mod = Color(3, 2.4, 2.2)
	elif iframes > 0 and fmod(t, 0.12) < 0.06 and not dead:
		mod = Color(1, 1, 1, 0.55)
	if not burn.is_empty():
		mod = mod * Color(1.25, 0.85, 0.7)
	Data.draw_frame(self, shw if useweapon else sh, f, mod)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
