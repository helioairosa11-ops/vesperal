extends "res://scripts/boss.gd"
## SIR CAEDMON, O ESCUDO DA RAINHA — chefe centrado no aparo (porte de js/game/bosses.js).
## Escudo absoluto: só leva dano com a postura quebrada; a postura só enche com aparos (3).
## Fases 2–3: "ao alto escudos" — os archeiros mortos da muralha disparam uma saraivada; só debaixo do escudo dele se está a salvo.

const RIPOSTE := 2.2
var posture := 0
var broken := 0.0
var block_t := 0.0
var shield_hits := 0
var volley_t := 0.0
var volley_hint := false

func _def() -> Dictionary:
	return {"w": 30, "h": 66, "hp": 620, "music": "b_caedmon", "phases": [0.66, 0.33], "eye": Color("#bcd8ff"),
		"anim_map": {"cut2a": "atk_cut", "combo3a": "atk_cut", "combo3b": "atk_cut2b", "combo3c": "atk_cut"},
		"attacks": {
			"cut": {"wind": 0.55, "act": 0.13, "rec": 0.45, "dmg": 18, "tell": "white", "hb": [2, 10, 62, 70], "lunge": 120.0},
			"cut2a": {"wind": 0.45, "act": 0.12, "rec": 0.12, "dmg": 16, "tell": "white", "hb": [2, 10, 62, 70], "lunge": 110.0, "next": "cut2b"},
			"cut2b": {"wind": 0.38, "act": 0.12, "rec": 0.5, "dmg": 16, "tell": "white", "hb": [4, 16, 60, 80], "lunge": 130.0},
			"feint": {"wind": 0.9, "act": 0.13, "rec": 0.45, "dmg": 20, "tell": "white", "hb": [2, 10, 64, 70], "lunge": 160.0},
			"combo3a": {"wind": 0.4, "act": 0.11, "rec": 0.1, "dmg": 15, "tell": "white", "hb": [2, 10, 62, 70], "lunge": 120.0, "next": "combo3b"},
			"combo3b": {"wind": 0.3, "act": 0.11, "rec": 0.12, "dmg": 15, "tell": "white", "hb": [4, 16, 60, 80], "lunge": 120.0, "next": "combo3c"},
			"combo3c": {"wind": 0.55, "act": 0.13, "rec": 0.6, "dmg": 20, "tell": "white", "hb": [0, 0, 68, 72], "lunge": 170.0},
			"thrust": {"wind": 0.7, "act": 0.22, "rec": 0.9, "dmg": 26, "tell": "red", "hb": [10, 30, 68, 18], "lunge": 420.0},
			"bash": {"wind": 0.35, "act": 0.12, "rec": 0.4, "dmg": 12, "tell": "", "sfx": "shield", "hb": [6, 6, 30, 64], "lunge": 220.0},
			"volley": {"wind": 0.7, "act": 2.2, "rec": 0.6, "tell": "", "sfx": "shield"},
		}}

func exposed() -> bool:
	return broken > 0 or super.exposed()

func _think_boss(dt: float) -> void:
	if block_t > 0:
		block_t -= dt
	if broken > 0:
		broken -= dt; vel.x = move_toward(vel.x, 0, 600 * dt); atk = {}
		if broken <= 0:
			broken = 0.0; posture = 0; guarding = true; cool = 0.3
			world.audio.sfx("shield")
		return
	if not atk.is_empty():
		return
	face()
	var d := absf(dx())
	guarding = true
	if cool > 0:
		walk(facing if d > 70 else (-facing if d < 40 else 0), 60, dt); return
	if d > 110:
		walk(facing, 90, dt)
		if phase >= 2 and randf() < 0.01:
			attack("thrust")
		return
	var r := randf()
	if phase == 0:
		attack("cut" if r < 0.6 else "cut2a")
	elif phase == 1:
		attack("cut2a" if r < 0.35 else ("feint" if r < 0.6 else ("combo3a" if r < 0.85 else "bash")))
	else:
		# na última fase a saraivada também entra na roda
		if r < 0.12 and d > 50:
			attack("volley")
		else:
			attack("combo3a" if r < 0.3 else ("thrust" if r < 0.48 else ("feint" if r < 0.66 else ("cut2a" if r < 0.84 else "bash"))))

func _on_phase(p: int) -> void:
	# ao entrar nas fases 2 e 3 ergue o pavês e chama a saraivada
	if p >= 1:
		atk = {}; cool = 0.0
		attack("volley")

func _act(nm: String, s: Dictionary) -> void:
	if nm == "combo3b":
		s["next"] = "thrust" if phase >= 2 and randf() < 0.5 else "combo3c"
	if nm == "bash":
		var p = player
		if p.action.get("type", "") == "parry":
			p.action = {}; p.vel.x = -p.facing * 220.0
			world.toast(Data.t("tip_guardbreak"))
	if nm == "volley":
		world.audio.sfx("roar", 0.5); volley_t = 0.0
		if not volley_hint:
			volley_hint = true; world.toast(Data.t("tip_caedmon_volley"))
	if nm == "thrust":
		world.audio.sfx("swing_heavy")

func _dur(nm: String, _s: Dictionary, dt: float) -> void:
	if nm != "volley":
		return
	vel.x = 0
	volley_t -= dt
	if volley_t > 0:
		return
	volley_t = 0.09 if phase >= 2 else 0.12
	var W: float = world.room.size_px().x
	var x := randf_range(40, W - 40)
	if absf(x - cx) < 46:
		x = cx + (-1 if x < cx else 1) * randf_range(50, 90)
	world.spawn_projectile({"pos": Vector2(x, world.cam.get_screen_center_position().y - 200), "vel": Vector2(randf_range(-20, 20), 460), "size": Vector2(4, 12),
		"dmg": 12.0, "kind": "bolt", "color": Color("#c8c0b0"), "life": 2.4, "solid": true})
	if randf() < 0.25:
		world.audio.sfx("shoot", 0.3)

## escudo absoluto: com a postura inteira, o golpe é aparado no pavês
func _hit_boss(b: Dictionary) -> Variant:
	if broken > 0:
		var mult := 1.6 if b.get("kind", "") == "riposte" else 1.0
		var b2 := b.duplicate(); b2["dmg"] = b["dmg"] * mult
		return on_hit_raw(b2)
	world.audio.sfx("shield"); world.audio.sfx("hit_metal", 0.5)
	world.fx.block(cx + facing * 14, cy - 6, -facing, true)
	block_t = 0.2
	player.vel.x = -player.facing * 180.0
	world.hitstop(0.03)
	shield_hits += 1
	if shield_hits == 2 or shield_hits % 6 == 0:
		world.toast(Data.t("tip_caedmon_shield"))
	if shield_hits % 4 == 0 and atk.is_empty():
		attack("bash")
	return false

## aparar enche a postura; com 3 quebra-se e abre a janela de contra-ataque
func _parried() -> bool:
	posture += 1
	atk = {}; cool = 0.35; vel.x = -facing * 140.0
	world.fx.stun_at(cx, pos.y + 2)
	world.audio.sfx("stagger")
	if posture >= 3:
		posture = 3; broken = RIPOSTE; guarding = false
		world.audio.sfx("choir_hit"); world.flash_screen(Color("#fff6e0"), 0.4)
		world.toast(Data.t("tip_caedmon_broken"))
	else:
		stagger = 0.25
	return true

func _anim_state() -> Dictionary:
	if broken > 0:
		return {"anim": "broken"}
	if block_t > 0 and atk.is_empty():
		return {"anim": "block", "idx": (1.0 - block_t / 0.2) * 3.0}
	return {}

func _process(delta: float) -> void:
	super._process(delta)
	if eye_light:
		eye_light.enabled = broken <= 0 and not dead

func _draw() -> void:
	super._draw()
	# postura (3 marcas por cima da cabeça), como no jogo web
	if dead or intro:
		return
	for i in 3:
		var c := Color(1, 0.85, 0.5, 0.95) if i < posture else Color(0.3, 0.3, 0.35, 0.6)
		draw_rect(Rect2(-10 + i * 7, -size.y - 10, 5, 3), c)
