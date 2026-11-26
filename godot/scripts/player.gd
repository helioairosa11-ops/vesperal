extends Actor
## O Desperto: movimento, combo de espada, esquiva, aparo, cura, queimadura. Valores iguais aos do jogo web.

const C := {
	"RUN": 160.0, "ACC_G": 1700.0, "ACC_A": 1350.0, "FRIC": 2100.0,
	"GRAV": 1350.0, "FALL_MUL": 1.2, "MAXFALL": 480.0, "JUMP": -452.0, "JUMP_CUT": 0.42, "DOUBLE": -412.0,
	"CLIMB_UP": 58.0, "CLIMB_UP_G": 80.0, "CLIMB_DOWN": 150.0, "CLIMB_STAM": 1.4, "CLIMB_STAM_G": 3.0, "CLIMB_HOP": -300.0,
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
var climbing := false
var climb_side := 1
var climb_phase := 0.0
var climb_stam := 3.0
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
var step_t := 0.0
var light: PointLight2D

func _ready() -> void:
	team = "player"
	size = Vector2(12, 30)
	gravity = C["GRAV"]; max_fall = C["MAXFALL"]
	max_hp = GameState.max_hp; hp = GameState.hp
	sh = Data.sheet("hero2"); shw = Data.sheet("hero2_espada")
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	# imagens residuais da esquiva: silhueta pintada numa cor (Assets.drawTinted do jogo web)
	for addmode in [false, true]:
		var n := Node2D.new()
		var mt := ShaderMaterial.new(); mt.shader = Shader.new()
		mt.shader.code = "shader_type canvas_item;\n" + ("render_mode blend_add;\n" if addmode else "") + "void fragment() { COLOR = vec4(COLOR.rgb, texture(TEXTURE, UV).a * COLOR.a); }"
		n.material = mt
		n.show_behind_parent = true
		add_child(n)
		if addmode:
			ghost_add = n
		else:
			ghost_norm = n
		n.draw.connect(_draw_ghosts.bind(addmode))
	flash_node = Node2D.new()
	var fm := CanvasItemMaterial.new(); fm.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	flash_node.material = fm
	add_child(flash_node)
	flash_node.draw.connect(_draw_flash)
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
	GameState.lume = minf(100.0, GameState.lume + dt * 0.6)
	heal_glow = maxf(0.0, heal_glow - dt)
	jump_buf = maxf(0.0, jump_buf - dt)
	attack_buf = maxf(0.0, attack_buf - dt)
	land_t = maxf(0.0, land_t - dt)
	land_squash = maxf(0.0, land_squash - dt * 4.0)
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
		if _jp("parry"):
			_parried(pending_hit["box"])
			pending_hit = {}
		elif pending_hit["t"] <= 0:
			var b: Dictionary = pending_hit["box"]
			pending_hit = {}
			_take_damage(b)
	if _jp("jump"):
		jump_buf = C["JUMP_BUF"]
	if _jp("attack"):
		attack_buf = 0.12
	var ax := _ax("left", "right")
	ax = signf(ax)
	var up := _pr("up")
	var down := _pr("down")
	if ax != 0 and wall_lock <= 0 and (action.is_empty() or action.get("can_turn", false)):
		facing = int(ax)
	crouch = on_ground and down and action.is_empty()
	# ---- iniciar ações
	if _jp("parry") and (action.is_empty() or can_act()):
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
	# parede (como no jogo web, player.js): agarra-se e trepa — cima sobe, baixo desliza, nada fica agarrada — com
	# fôlego limitado (renova-se no chão); no topo sobe por cima do rebordo. A Garra (abilities.wall) dá mais fôlego,
	# subida mais rápida, o impulso pela parede acima e o salto de parede.
	wall_dir = 0
	var garra: bool = GameState.abilities.get("wall", false)
	var climb_now := false
	if on_ground and up and ax != 0 and action.is_empty() and not crouch and _touch_wall(int(ax)):
		on_ground = false; pos.y -= 1; vel.y = -30; climbing = true; climb_side = int(ax)
	if not on_ground and (action.is_empty() or action.get("type", "") == "attack"):
		var wd: int = int(ax) if ax != 0 else (climb_side if climbing and (up or down) else 0)
		if wd != 0 and _touch_wall(wd) and (vel.y > -40 or climbing):
			wall_dir = wd; air_dash = false; double_used = false
			if action.is_empty() and climb_stam > 0:
				climb_now = true; climb_side = wd; facing = wd
				vel.y = -(C["CLIMB_UP_G"] if garra else C["CLIMB_UP"]) if up else (C["CLIMB_DOWN"] if down else 0.0)
				grav = 0.0
				climb_stam -= dt * (1.0 if up else (0.0 if down else 0.32))
				if up or down:
					climb_phase = fmod(climb_phase + dt * (1.8 if up else 2.6), 1.0)
				# topo da parede: a cabeça já passa o rebordo → sobe por cima
				if (up or int(ax) == wd) and not down and not world.room.rect_solid(Rect2(pos + Vector2(wd * 2, -4), Vector2(size.x, 10))):
					vel.y = -250; vel.x = wd * 110; wall_lock = 0.2; climb_now = false; world.audio.sfx("jump", 0.3)
			else:
				max_fall = C["WALL_SLIDE"]
	climbing = climb_now
	if on_ground:
		climb_stam = C["CLIMB_STAM_G"] if garra else C["CLIMB_STAM"]; climbing = false
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
		elif climbing and up and GameState.abilities.get("wall", false) and climb_stam > 0.2:
			vel.y = C["CLIMB_HOP"]; climb_stam -= 0.4; jump_buf = 0; world.audio.sfx("jump", 0.35)
		elif wall_dir != 0:
			climbing = false
			vel.x = -wall_dir * C["WALL_JVX"]; facing = -wall_dir; wall_lock = C["WALL_LOCK"]
			_jump(C["WALL_JVY"])
		elif GameState.abilities.get("double", false) and not double_used:
			double_used = true; _jump(C["DOUBLE"])
	if _jr("jump") and vel.y < 0:
		vel.y *= C["JUMP_CUT"]
	var was_ground := on_ground
	var fall_v := vel.y
	var res := physics(dt)
	if res["landed"] and not was_ground and fall_v > 200:
		land_t = 0.18
		land_squash = minf(1.0, fall_v / 600.0)
		world.audio.sfx("land", minf(1.0, fall_v / 500.0))
		world.fx.burst_o(cx, bottom, 6, {"color": "#8a8078", "speed": 60.0, "angle": -PI / 2, "spread": 2.6, "life": 0.4, "size": 1.4, "g": 200.0})
	air_t = 0.0 if on_ground else air_t + dt
	if on_ground and absf(vel.x) > 60 and action.is_empty():
		step_t -= dt * absf(vel.x) / 160.0
		if step_t <= 0:
			step_t = 0.3
			world.audio.sfx("step_stone", 0.35)
	_update_action(dt)
	# perigos (espinhos, lava)
	var tx := floori(cx / 20.0)
	var ty := floori((bottom - 2) / 20.0)
	if world.room.is_hazard(tx, ty) and iframes <= 0:
		_take_damage({"dmg": 20.0, "knock": 200.0, "src": null, "unblockable": true})
	# rasto da esquiva
	for g in afterimages:
		g["a"] -= dt * 2.2
	afterimages = afterimages.filter(func(g): return g["a"] > 0)

func _on_platform() -> bool:
	var ty := floori((bottom + 1) / 20.0)
	return world.room.is_platform(floori(cx / 20.0), ty)

func _jump(v: float) -> void:
	var dbl := not on_ground and double_used and air_t > 0.0
	vel.y = v; jump_buf = 0; on_ground = false
	world.audio.sfx("jump", 0.8 if dbl else 0.5)
	if dbl:
		world.fx.burst_o(cx, bottom, 12, {"color": "#d8c8b0", "speed": 90.0, "angle": PI / 2, "spread": 2.2, "life": 0.45, "size": 1.6})
		world.audio.sfx("moth", 0.5)
	else:
		world.fx.burst_o(cx, bottom, 5, {"color": "#8a8078", "speed": 50.0, "angle": -PI / 2, "spread": 2.8, "life": 0.3, "size": 1.2})
	if action.get("type", "") == "attack":
		action = {}

func _try_actions(ax: float, up: bool, down: bool) -> void:
	if _jp("heal") and on_ground:
		_start_heal(); return
	if _jp("dodge") and dodge_cd <= 0:
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
	var short: bool = air and not GameState.abilities.get("dash", false)
	action = {"type": "dodge", "t": 0.0, "dur": (0.13 if short else 0.2) if air else 0.34, "air": air, "short": short, "dir": facing, "inv": false}
	if air:
		air_dash = true; vel.y = 0
	dodge_cd = 0.3 if air else 0.32
	world.audio.sfx("dodge")
	world.fx.burst_o(cx, bottom - 2, 8, {"color": "#c8b8a8" if air else "#7a7068", "speed": 70.0, "angle": PI if facing > 0 else 0.0, "spread": 1.0, "life": 0.4, "size": 1.6})

func _start_parry() -> void:
	action = {"type": "parry", "t": 0.0, "phase": "act", "window": C["PARRY"], "dur": 0.38, "success": false, "can_turn": true}
	if not pending_hit.is_empty():
		_parried(pending_hit["box"]); pending_hit = {}

func _start_heal() -> void:
	if GameState.flasks <= 0:
		world.audio.sfx("ui_back"); world.toast(Data.t("msg_no_flasks")); return
	if hp >= max_hp:
		world.toast(Data.t("msg_full_hp")); return
	action = {"type": "heal", "t": 0.0, "dur": 0.85, "done": false}
	world.audio.sfx("charge", 0.4)
	world.fx.art("heal", cx, pos.y + size.y + 1, {"h": 44.0, "life": 1.1, "follow": self, "alpha": 0.6})

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
				attack_boxes.append({"rect": r, "dmg": BASE_DMG * d["mult"] * (1.3 if GameState.buffs.get("oil", 0.0) > 0 else 1.0), "id": action["id"], "knock": d["knock"], "kind": d.get("kind", "slash"), "pogo": d.get("pogo", false), "hitstop": d.get("hitstop", 0.05), "src": self})
				if action["t"] >= action["act"]:
					action["phase"] = "rec"; action["t"] = 0.0; action["lunge_v"] = 0.0
			elif action["phase"] == "rec" and action["t"] >= action["rec"]:
				action = {}
		"dodge":
			# velocidade, janela de invulnerabilidade e rasto iguais ao jogo web (player.js)
			var a := action
			var k: float = a["t"] / a["dur"]
			var sp: float = (240.0 if a["short"] else 330.0) if a["air"] else lerpf(300.0, 110.0, k * k)
			vel.x = a["dir"] * sp
			if a["air"] and not a["short"]:
				vel.y = 0
			var tt: float = a["t"]
			a["inv"] = ((tt > 0.02 and tt < 0.09) if a["short"] else (tt > 0.02 and tt < 0.15)) if a["air"] else (tt > 0.04 and tt < 0.26)
			if randf() < 0.7 or a["inv"]:
				afterimages.append({"p": Vector2(cx, bottom), "f": facing, "fr": _current_frame(), "sh": sh, "a": 0.6 if a["inv"] else 0.4, "inv": a["inv"]})
			if a["inv"] and randf() < 0.9:
				world.fx.emit({"x": cx - a["dir"] * randf_range(4, 12), "y": pos.y + randf_range(4, size.y - 2), "vx": -a["dir"] * randf_range(160, 260), "vy": 0.0, "drag": 6.0,
					"life": randf_range(0.12, 0.22), "size": randf_range(2, 3.2), "color": ["#d8ccff", "#a898f0", "#ffffff"].pick_random(), "add": true, "kind": "line"})
			if a["t"] >= a["dur"]:
				action = {}
				if not a["air"]:
					vel.x *= 0.5
		"parry":
			if action["t"] >= action["dur"]:
				action = {}
		"heal":
			if randf() < 0.5:
				world.fx.emit({"x": cx + randf_range(-8, 8), "y": bottom - randf_range(0, 20), "vy": -40.0, "life": 0.6, "size": 1.4, "color": "#ffd080", "add": true, "shrink": true})
			if not action["done"] and action["t"] >= action["dur"]:
				action["done"] = true
				GameState.flasks -= 1
				hp = minf(max_hp, hp + round(max_hp * 0.45)); GameState.hp = int(hp)
				heal_glow = 0.8; burn = {}
				world.fx.burst_o(cx, cy, 20, {"color": "#ffd890", "speed": 90.0, "life": 0.7, "size": 1.8, "add": true})
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
	if action.get("type", "") == "dodge" and action.get("inv", false):
		if not action.get("perfect", false):
			action["perfect"] = true
			world.fx.burst_o(cx, cy, 10, {"color": "#d0c0ff", "speed": 60.0, "life": 0.4, "size": 1.4, "add": true})
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
	GameState.lume = minf(100.0, GameState.lume + 25.0)
	iframes = maxf(iframes, 0.2)
	var src = box.get("src")
	world.fx.parry(cx + facing * 14, pos.y + 12, facing)
	world.hitstop(0.14)
	world.shake(0.25)
	world.flash_screen(Color.WHITE, 0.35)
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
	var dmg: float = box.get("dmg", 10.0) * (0.7 if GameState.buffs.get("incense", 0.0) > 0 else 1.0)
	hp = maxf(0.0, hp - dmg); GameState.hp = int(hp)
	flash = 0.15
	iframes = C["IFRAMES"]
	var src = box.get("src")
	var dir := -facing
	if src != null and is_instance_valid(src):
		dir = 1 if cx >= src.cx else -1
	vel = Vector2(dir * box.get("knock", 160.0), -200)
	action = {"type": "hurt", "t": 0.0}
	world.fx.hurt(cx, cy - 4, dir)
	world.hitstop(0.08); world.shake(0.3)
	world.audio.sfx("hurt"); world.flash_screen(Color("#a01010"), 0.24); world.hurt = 1.0
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
	world.audio.sfx("death")
	world.on_player_dead()

func on_hit_enemy(box: Dictionary) -> void:
	if box.get("pogo", false):
		vel.y = -380; double_used = false; air_dash = false
		action = {}

func _touch_wall(d: int) -> bool:
	return world.room.rect_solid(Rect2(pos + Vector2(d * 2, 2), size - Vector2(0, 8)))

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
	if k == "climb":
		return Data.frame(sh, k, climb_phase * 6.0)
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
		if climbing:
			k = "climb" if absf(vel.y) > 5 else "climbIdle"
		elif wall_dir != 0:
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

var flash_node: Node2D
var land_squash := 0.0
var _last_sh: Dictionary = {}
var _last_f: Dictionary = {}

## clarão de dano: o fotograma por cima em aditivo, 1 + 0,6 (Assets.drawFlash duas vezes)
func _draw_flash() -> void:
	if flash <= 0 or _last_f.is_empty():
		return
	var sx := 1.0; var sy := 1.0
	if land_squash > 0:
		sx = 1.0 + land_squash * 0.12; sy = 1.0 - land_squash * 0.1
	flash_node.draw_set_transform(Vector2.ZERO, 0, Vector2(facing * sx, sy))
	Data.draw_frame(flash_node, _last_sh, _last_f, Color(1, 1, 1, 1))
	Data.draw_frame(flash_node, _last_sh, _last_f, Color(1, 1, 1, 0.6))
	flash_node.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

var ghost_norm: Node2D
var ghost_add: Node2D

## invulnerável: rasto claro e esticado (#7a6ad8, aditivo); os outros, sombra azul (#3a5aa0)
func _draw_ghosts(addmode: bool) -> void:
	var n: Node2D = ghost_add if addmode else ghost_norm
	for g in afterimages:
		if g["fr"].is_empty() or g["inv"] != addmode:
			continue
		if addmode:
			n.draw_set_transform(g["p"] - position, 0, Vector2(g["f"] * 1.12, 0.94))
			Data.draw_frame(n, g["sh"], g["fr"], Color(Color("#7a6ad8"), g["a"] * 0.6))
		else:
			n.draw_set_transform(g["p"] - position, 0, Vector2(g["f"], 1))
			Data.draw_frame(n, g["sh"], g["fr"], Color(Color("#3a5aa0"), g["a"] * 0.45))
	n.draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)

func _draw() -> void:
	if sh.is_empty():
		return
	ghost_norm.queue_redraw(); ghost_add.queue_redraw()
	# escala como no jogo web: achata ao aterrar, estica na esquiva
	var sx := 1.0; var sy := 1.0
	if land_squash > 0:
		sx = 1.0 + land_squash * 0.12; sy = 1.0 - land_squash * 0.1
	if action.get("type", "") == "dodge":
		var kk := sin(minf(1.0, action["t"] / action["dur"]) * PI)
		sx *= 1.0 + 0.14 * kk; sy *= 1.0 - 0.08 * kk
	draw_set_transform(Vector2.ZERO, 0, Vector2(facing * sx, sy))
	var f := _current_frame()
	var useweapon: bool = action.get("type", "") in ["attack", "parry"]
	var mod := Color.WHITE
	if iframes > 0 and iframes < 0.9 and not dead and int(floor(t * 20.0)) % 2 == 0:
		mod.a = 0.5
	_last_sh = shw if useweapon else sh
	_last_f = f
	Data.draw_frame(self, _last_sh, f, mod)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
	flash_node.queue_redraw()

# ------------------------------------------------------------------ entrada (bloqueada durante diálogos e cenas)
func _blocked() -> bool:
	return world.cutscene
func _jp(a: String) -> bool:
	return not _blocked() and Input.is_action_just_pressed(a)
func _pr(a: String) -> bool:
	return not _blocked() and Input.is_action_pressed(a)
func _jr(a: String) -> bool:
	return not _blocked() and Input.is_action_just_released(a)
func _ax(a: String, b: String) -> float:
	return 0.0 if _blocked() else Input.get_axis(a, b)
