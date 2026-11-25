extends Enemy
## O Coveiro — subchefe do Cemitério (porte de js/game/bosses.js), com as melhorias pedidas:
## fase 2 com folha própria e +20% de vida uma vez, queimadura na fase 2, torrões atirados rente ao chão,
## 3 aparos (4 na fase 2) deixam-no atordoado, e nada cai do céu.

const AGGR := [1.6, 1.95]
const PHASES := [0.5]

var phase := 0
var healed := false
var underground := false
var target_x := 0.0
var parry_n := 0
var parry_last := -99.0
var dazed := false
var intro := true
var intro_t := 0.0
var back_hint := false
var sh_p1: Dictionary
var sh_p2: Dictionary

func setup_boss(tx: int, ty: int) -> void:
	kind = "coveiro"
	K = {
		"cfg": {"w": 40, "h": 64, "hp": 520, "ash": 0},
		"attacks": {
			"slam": {"wind": 0.8, "act": 0.16, "rec": 1.15, "dmg": 22, "tell": "white", "hb": [10, 0, 64, 62]},
			"sweep": {"wind": 0.6, "act": 0.18, "rec": 0.6, "dmg": 18, "tell": "", "hb": [-6, 0, 84, 26], "lunge": 50.0},
			"clods": {"wind": 0.65, "act": 0.1, "rec": 0.7, "tell": ""},
			"burrow": {"wind": 0.7, "act": 1.4, "rec": 0.6, "dmg": 24, "tell": "red"},
		},
		"think": "_think_boss",
	}
	size = Vector2(40, 64)
	pos = Vector2(tx * 20 + 10 - size.x / 2, (ty + 1) * 20 - size.y)
	hp = 520.0; max_hp = hp
	team = "enemy"; facing = -1
	sh_p1 = Data.sheet("en_b_coveiro"); sh_p2 = Data.sheet("en_b_coveiro_p2")
	sh = sh_p1
	cool = 1.0

func _ready() -> void:
	super._ready()
	eye_light = PointLight2D.new()
	eye_light.texture = world.light_tex
	eye_light.color = Color(1.0, 0.72, 0.29)
	eye_light.energy = 0.9
	eye_light.texture_scale = 0.6
	add_child(eye_light)

func is_heavy() -> bool:
	return true

func is_fire_source() -> bool:
	return phase >= 1

func tick(dt: float) -> void:
	if intro:
		intro_t += dt
		if randf() < 0.7:
			world.fx.dust(Vector2(cx + randf_range(-20, 20), bottom), 1)
		if intro_t > 1.6:
			intro = false
			world.shake(0.4); world.audio.sfx("roar")
		t += dt
		return
	super.tick(dt)
	# fases: ao passar para a 2.ª recupera 20% da vida uma vez e troca para a folha em brasa
	while phase < PHASES.size() and hp / max_hp <= PHASES[phase]:
		phase += 1
		if not healed:
			healed = true
			hp = minf(max_hp, hp + max_hp * 0.2)
			sh = sh_p2
			world.fx.burst(Vector2(cx, cy), 40, Color(1, 0.55, 0.2), 160.0, true)
			world.flash_screen(Color(1, 0.6, 0.3), 0.35)
			world.shake(0.45); world.audio.sfx("roar")
			cool = 0.2
	if dazed and stagger <= 0:
		dazed = false

func _think_boss(dt: float) -> void:
	if not atk.is_empty():
		return
	face()
	var d := absf(dx())
	# a espera entre golpes passa mais depressa em cada fase
	cool -= dt * (AGGR[phase] - 1.0)
	if cool > 0:
		walk(facing if d > 80 else 0, 42, dt)
		return
	var r := randf()
	if d < 80:
		attack("sweep" if r < 0.5 else "slam")
	elif d < 180:
		attack("slam" if r < 0.5 else ("burrow" if phase > 0 and r < 0.8 else "clods"))
	else:
		attack("burrow" if phase > 0 and r < 0.5 else "clods")

func _on_act(name: String, _s: Dictionary) -> void:
	match name:
		"slam":
			world.shake(0.45); world.audio.sfx("crush")
			var x := cx + facing * 66
			world.fx.dust(Vector2(x, bottom - 2), 22)
			if phase > 0:
				world.fx.burst(Vector2(x, bottom - 6), 16, Color(1, 0.5, 0.15), 140.0, true)
		"sweep":
			world.audio.sfx("swing_heavy")
		"clods":
			world.audio.sfx("swing_heavy")
			var n := 3 if phase > 0 else 2
			var dir := signf(player.cx - cx)
			if dir == 0:
				dir = facing
			for i in n:
				world.spawn_projectile({"pos": Vector2(cx + dir * 26, bottom - 18 - i * 6), "vel": Vector2(dir * (230 + i * 70), -140 - i * 25),
					"grav": 650.0, "size": Vector2(10, 10), "dmg": 12.0, "kind": "clod", "life": 3.0, "fire": phase > 0})
		"burrow":
			underground = true; hittable = false
			world.audio.sfx("crush")
			world.fx.dust(Vector2(cx, bottom), 20)

func _during(name: String, _s: Dictionary, dt: float) -> void:
	if name == "sweep" and randf() < 0.7:
		world.fx.dust(Vector2(cx + facing * randf_range(10, 70), bottom - 1), 1)
	if name == "burrow":
		var a := atk
		if a["t"] < 1.0:
			vel.x = 0; target_x = player.cx
			if randf() < 0.5:
				world.fx.dust(Vector2(target_x + randf_range(-14, 14), bottom - 2), 1)
		elif not a.get("emerged", false):
			a["emerged"] = true
			pos.x = clampf(target_x - size.x / 2, 40, world.room.size_px().x - size.x - 40)
			underground = false; hittable = true
			world.shake(0.5); world.audio.sfx("crush")
			world.fx.dust(Vector2(cx, bottom), 30)
		if a.get("emerged", false) and a["t"] < 1.2:
			attack_boxes.append({"rect": Rect2(pos.x - 8, pos.y - 20, size.x + 16, size.y + 20), "dmg": 24.0, "id": a["id"], "unblockable": true, "parryable": false, "knock": 220.0, "src": self, "fire": phase > 0})

## fraqueza: com a pá cravada no chão (depois do golpe de cima) as costas ficam expostas
func damage_mult(_box: Dictionary) -> float:
	var behind: bool = (player.cx - cx) * facing < 0
	if not atk.is_empty() and atk["name"] == "slam" and atk["phase"] == "rec" and behind:
		if not back_hint:
			back_hint = true
			world.toast(Data.t("tip_coveiro_back"))
		return 1.8
	return 1.0

## aparos: 3 seguidos (4 na 2.ª fase) deixam-no atordoado, de joelhos, durante 2,4 s
func on_parried() -> void:
	if dazed and stagger > 0:
		return
	if t - parry_last > 8.0:
		parry_n = 0
	parry_last = t
	parry_n += 1
	if parry_n >= (4 if phase >= 1 else 3):
		parry_n = 0
		do_stagger(2.4, true); dazed = true
		world.flash_screen(Color(1, 0.96, 0.88), 0.3)
		world.hitstop(0.12); world.audio.sfx("stagger")
	else:
		do_stagger(0.7, true)
		vel.x = -facing * 80.0

func on_hit(box: Dictionary) -> bool:
	if underground or intro:
		return false
	return super.on_hit(box)

func die() -> void:
	if dead:
		return
	dead = true; hittable = false; atk = {}
	GameState.bosses["coveiro"] = true
	GameState.abilities["dash"] = true
	world.on_boss_defeated(self)

## o corpo fica no chão (não desaparece como os inimigos comuns)
func _process(delta: float) -> void:
	_proc(delta)

func current_frame() -> Dictionary:
	if intro:
		return Data.frame(sh, "emerge", minf(4.9, intro_t / 1.6 * 5.0))
	if dead:
		return Data.frame(sh, "death", _death_t * 4.2)
	if stagger > 0:
		return _timed("stagger")
	if not atk.is_empty() and atk["name"] == "burrow" and atk.get("emerged", false):
		return Data.frame(sh, "emerge", minf(sh["meta"]["anims"]["emerge"]["frames"].size() - 0.1, (atk["t"] - 1.0) / 0.5 * 5.0))
	return super.current_frame()

func _proc(delta: float) -> void:
	super._process(delta)
	if dead:
		_death_t = minf(_death_t, 1.6)
	if eye_light:
		eye_light.color = Color(1.0, 0.45, 0.15) if phase > 0 else Color(1.0, 0.72, 0.29)
		eye_light.energy = 1.4 if phase > 0 else 0.9
		eye_light.enabled = not underground

func _draw() -> void:
	if underground:
		# só um monte de terra a mexer onde vai sair
		var x := target_x - position.x
		for i in 3:
			var c: Color = [Color("#5a4636"), Color("#7a634c"), Color("#9a8268")][i]
			var rw := 26.0 - i * 6.0
			var rh := 7.0 - i * 1.6 + sin(t * 12.0) * 0.6
			var pts := PackedVector2Array()
			for k in 13:
				var a := PI + PI * k / 12.0
				pts.append(Vector2(x + cos(a) * rw + sin(t * 9.0 + i) * 1.5, sin(a) * rh))
			draw_colored_polygon(pts, c)
		return
	if underground:
		pass
	if dazed and stagger > 0:
		# estrelas de atordoamento à volta da cabeça
		for i in 3:
			var a := t * 4.0 + i * TAU / 3.0
			draw_circle(Vector2(cos(a) * 16.0, -size.y - 6 + sin(a) * 4.0), 2.0, Color(1, 0.9, 0.5, 0.9))
	super._draw()
