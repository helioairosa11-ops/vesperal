extends "res://scripts/boss.gd"
## A MÃE-MARIPOSA — subchefe dos Jardins (porte de js/game/bosses.js). Voa; depois do pó fica exausta e pousa
## (ponto fraco ×1,6; três golpes — ou um pesado — deixam-na atordoada no chão). Concede o salto duplo.

var resting := 0.0
var want_rest := false
var rest_hits := 0
var rest_stag := false
var rest_hint := false
var dive_chain := false
var spin_a := 0.0
var spin_t := 0.0

func _def() -> Dictionary:
	return {"w": 50, "h": 46, "hp": 660, "music": "sb_mariposa", "phases": [0.5], "flying": true, "center": true, "parry_stagger": 0.9, "eye": Color("#ffe8a0"),
		"attacks": {
			"dive": {"wind": 0.55, "act": 0.62, "rec": 0.42, "dmg": 20, "tell": "red", "sfx": "wind"},
			"swarm": {"wind": 0.7, "act": 0.1, "rec": 0.7, "tell": "", "sfx": "moth"},
			"dust": {"wind": 0.6, "act": 0.3, "rec": 0.5, "tell": "", "sfx": "moth"},
			"gust": {"wind": 0.55, "act": 1.5, "rec": 0.5, "tell": "", "sfx": "moth"},
		}}

func exposed() -> bool:
	return resting > 0 or super.exposed()

func _think_boss(dt: float) -> void:
	var fl: float = arena["floor"]
	if resting > 0:
		resting -= dt; vel = Vector2.ZERO; pos.y = fl - size.y
		if randf() < 0.08:
			world.fx.burst(Vector2(cx + randf_range(-20, 20), cy - 10), 1, Color(0.88, 0.82, 0.63), 12.0)
		if resting <= 0:
			resting = 0.0; cool = 0.25; vel.y = -220; world.audio.sfx("wind")
		return
	if not atk.is_empty():
		if atk["phase"] == "wind":
			vel *= 0.92
		return
	face()
	if want_rest:
		fly_to(Vector2(cx, fl - size.y / 2 + 5), 240, dt)
		if bottom >= fl - 3:
			want_rest = false; resting = 1.9 if phase > 0 else 2.5; rest_hits = 0; rest_stag = false
			pos.y = fl - size.y; world.audio.sfx("land"); world.fx.dust(Vector2(cx, fl - 2), 14)
			if not rest_hint:
				rest_hint = true; world.toast(Data.t("tip_mariposa_rest"))
		return
	fly_to(Vector2(player.cx + sin(anim * 0.8) * 140, player.cy - 110 + sin(anim * 1.7) * 30), 160, dt)
	if cool <= 0:
		var r := randf()
		attack("dive" if r < 0.35 else ("swarm" if r < 0.6 else ("dust" if r < 0.82 else "gust")))

func _act(nm: String, _s: Dictionary) -> void:
	match nm:
		"dive":
			var a := (Vector2(player.cx, player.cy) - Vector2(cx, cy)).angle()
			vel = Vector2(cos(a), sin(a)) * (470.0 if phase > 0 else 420.0)
		"swarm":
			var n := 6 if phase > 0 else 4
			for i in n:
				var a2: float = -PI / 2 + (i - (n - 1) / 2.0) * 0.5
				world.spawn_projectile({"pos": Vector2(cx, cy), "vel": Vector2(cos(a2), sin(a2)) * 120.0, "size": Vector2(9, 9), "dmg": 10.0, "kind": "moth", "color": Color("#f0e0a0"), "life": 5.0, "homing": 1.4, "solid": false})
		"dust":
			for i in [-1, 0, 1]:
				world.spawn_projectile({"pos": Vector2(player.cx + i * 60, cy), "vel": Vector2(0, 60), "size": Vector2(34, 34), "dmg": 6.0, "kind": "incense", "color": Color("#c8b880"), "life": 3.5, "solid": false, "parryable": false})
		"gust":
			spin_a = randf() * TAU; spin_t = 0.0

func _dur(nm: String, _s: Dictionary, dt: float) -> void:
	match nm:
		"dive":
			box(Rect2(pos.x + 8, pos.y + 6, size.x - 16, size.y - 12), 20, {"unblockable": true, "parryable": false})
			if randf() < 0.6:
				world.fx.burst(Vector2(cx, cy), 1, Color(0.92, 0.86, 0.67, 0.6), 30.0)
		"gust":
			vel *= 0.9
			spin_a += (2.9 if phase > 0 else 2.3) * dt; spin_t -= dt
			if spin_t > 0:
				return
			spin_t = 0.075 if phase > 0 else 0.095
			var arms := 3 if phase > 0 else 2
			for i in arms:
				var a: float = spin_a + i * TAU / arms
				world.spawn_projectile({"pos": Vector2(cx, cy), "vel": Vector2(cos(a), sin(a)) * 115.0, "size": Vector2(8, 8), "dmg": 9.0, "kind": "scale",
					"color": Color.from_hsv(fmod(t * 0.4 + i / 3.0, 1.0), 0.35, 1.0), "life": 4.5, "solid": false})

func _on_end(nm: String) -> void:
	match nm:
		"dive":
			vel.x *= 0.2; vel.y = -140
			var s: Dictionary = K["attacks"]["dive"]
			if phase > 0 and not dive_chain and randf() < 0.6:
				dive_chain = true; s["next"] = "dive"
			else:
				dive_chain = false; s.erase("next")
		"dust":
			want_rest = true   # depois do pó fica exausta e pousa

func damage_mult(b: Dictionary) -> float:
	if resting <= 0:
		return 1.0
	rest_hits += 3 if b.get("kind", "") == "heavy" else 1
	if rest_hits >= 3 and not rest_stag and stagger <= 0:
		rest_stag = true; stagger = 1.1; resting = maxf(resting, 1.2); world.audio.sfx("stagger")
	return 1.6

func _anim_state() -> Dictionary:
	if resting > 0:
		if stagger > 0:
			return {"anim": "stagger"}
		var L := 2.4 if phase > 0 else 3.0
		var k := L - resting
		return {"anim": "land", "idx": minf(1.9, k / 0.4 * 2.0)} if k < 0.4 else {"anim": "rest"}
	return {}
