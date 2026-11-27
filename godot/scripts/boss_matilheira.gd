extends "res://scripts/boss.gd"
## A MATILHEIRA — mastim velho e enorme do Canil (porte de js/game/bosses.js).
## Fraqueza: ao uivar ergue-se e mostra a barriga (×2; um golpe forte ou o segundo golpe interrompe o uivo).
## Fase 2: FÚRIA — corre a direito, derrapa na parede e volta; no fim fica a arfar (leva mais dano).

var bites := 0
var pant := 0.0
var howled := false
var howl_hurt := 0
var howl_broken := false
var ramp_dir := 1
var ramp_legs := 0
var skid := 0.0
var ramp_cd := 0
var ramp_hint := false

func _def() -> Dictionary:
	return {"w": 70, "h": 46, "hp": 620, "music": "sb_matilheira", "phases": [0.5], "eye": Color("#ff8030"),
		"anim_map": {"rampage": "move"},
		"attacks": {
			"lunge": {"wind": 0.5, "act": 0.3, "rec": 0.55, "dmg": 18, "tell": "", "sfx": "whip", "lunge": 380.0, "hb": [18, 6, 44, 40]},
			"bite": {"wind": 0.32, "act": 0.14, "rec": 0.25, "dmg": 14, "tell": "white", "sfx": "whip", "hb": [24, 14, 34, 32], "lunge": 60.0},
			"leap": {"wind": 0.55, "act": 0.9, "rec": 0.6, "dmg": 22, "tell": "red", "sfx": "wind"},
			"rampage": {"wind": 0.7, "act": 6.0, "rec": 0.4, "dmg": 24, "tell": "red", "sfx": "roar"},
			"howl": {"wind": 1.1, "act": 0.35, "rec": 0.6, "tell": "", "sfx": "howl"},
		}}

func exposed() -> bool:
	return pant > 0 or super.exposed()

func _intro_start() -> void:
	vel.y = -300

func _think_boss(dt: float) -> void:
	if pant > 0:
		pant -= dt; vel.x = move_toward(vel.x, 0, 600 * dt)
		if randf() < 0.12:
			world.fx.burst(Vector2(cx + facing * 34, pos.y + 18), 1, Color(0.86, 0.86, 0.9, 0.3), 20.0)
		return
	if not atk.is_empty():
		return
	face()
	var d := absf(dx())
	if phase > 0 and cool <= 0:
		ramp_cd -= 1
		if ramp_cd <= 0 and randf() < 0.35:
			ramp_cd = 4; attack("rampage"); return
	if cool > 0:
		walk(-facing if d < 110 else (facing if d > 190 else 0), 130, dt); return
	var r := randf()
	if (phase > 0 and not howled) or (summoned_alive() == 0 and r < 0.12):
		howled = true; howl_broken = false; howl_hurt = 0
		attack("howl"); return
	if d < 70:
		attack("bite")
	elif d < 200:
		attack("lunge" if r < 0.6 else "leap")
	else:
		attack("leap")

func _on_phase(_p: int) -> void:
	cool = 0.0

func _act(nm: String, _s: Dictionary) -> void:
	match nm:
		"lunge":
			vel.y = -140
		"leap":
			vel.x = (player.cx - cx) / 0.75; vel.y = -520
		"rampage":
			ramp_dir = facing; ramp_legs = 3 if hp < max_hp * 0.25 else 2; skid = 0.0
		"howl":
			if howl_broken:
				return
			for sd in [-1, 1]:
				summon("hound", cx + sd * 140)

func _dur(nm: String, _s: Dictionary, dt: float) -> void:
	match nm:
		"leap":
			box(Rect2(pos, size), 22, {"unblockable": true, "parryable": false})
			if on_ground and atk["t"] > 0.2:
				atk["t"] = 99.0; vel.x = 0
				world.shake(0.45); world.audio.sfx("crush")
				world.fx.dust(Vector2(cx + facing * 30, bottom - 2), 18)
		"rampage":
			if skid > 0:
				skid -= dt; vel.x = move_toward(vel.x, 0, 1600 * dt)
				if randf() < 0.8:
					world.fx.dust(Vector2(cx + ramp_dir * 20, bottom - 2), 1)
				if skid <= 0:
					ramp_dir *= -1; world.audio.sfx("roar", 0.4)
				return
			facing = ramp_dir; vel.x = ramp_dir * 430.0
			attack_boxes.append({"rect": Rect2(pos.x + 6, pos.y + 4, size.x - 12, size.y - 6), "dmg": 24.0, "id": atk["id"] * 10 + ramp_legs, "unblockable": true, "parryable": false, "knock": 260.0, "src": self})
			if randf() < 0.5:
				world.fx.dust(Vector2(cx - ramp_dir * 30, bottom - 2), 1)
			var W: float = world.room.size_px().x
			if wall_ahead(ramp_dir) or (pos.x + size.x >= W - 70 if ramp_dir > 0 else pos.x <= 70):
				ramp_legs -= 1
				if ramp_legs > 0:
					skid = 0.32; world.audio.sfx("step_stone"); return
				# sem fôlego: para de lado, de língua de fora — leva mais dano
				atk = {}; vel.x = 0; pant = 2.2 if phase > 0 else 2.6; cool = 0.4
				if not ramp_hint:
					ramp_hint = true; world.toast(Data.t("tip_matilheira_wall"))

func _on_end(nm: String) -> void:
	if nm == "bite":
		var s: Dictionary = K["attacks"]["bite"]
		bites += 1
		if bites <= (2 if phase > 0 else 1):
			s["next"] = "bite"
		else:
			bites = 0; s.erase("next")

func damage_mult(b: Dictionary) -> float:
	if pant > 0:
		return 1.6
	if stagger > 0 and parried:
		return 1.5
	if not atk.is_empty() and atk["name"] == "howl" and atk["phase"] != "rec":
		if not GameState.flags.get("tip_matilheira", false):
			GameState.flags["tip_matilheira"] = true; world.toast(Data.t("tip_matilheira_belly"))
		howl_hurt += 1
		if b.get("kind", "") in ["heavy", "riposte"] or howl_hurt >= 2:
			howl_broken = true
			call_deferred("do_stagger", 1.4, true)
		return 2.0
	return 1.0

func _anim_state() -> Dictionary:
	if pant > 0:
		return {"anim": "stagger"}
	if not atk.is_empty() and atk["name"] == "rampage" and atk["phase"] == "act":
		if skid > 0:
			return {"anim": "atk_lunge", "idx": 4.0}
		return {"anim": "move", "idx": fmod(anim * 16.0, 8.0)}
	return {}
