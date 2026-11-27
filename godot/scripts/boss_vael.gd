extends "res://scripts/boss.gd"
## INQUISIDORA VAEL — subchefe da Catedral (porte de js/game/bosses.js). O mangual crava-se no chão depois
## do segundo golpe (×1,8 enquanto o arranca). Pira: dois muros de fogo fecham-se sobre ti e rebentam no meio.

var pyre := {}
var stuck_hint := false

func _def() -> Dictionary:
	return {"w": 28, "h": 62, "hp": 820, "music": "sb_vael", "phases": [0.5], "eye": Color("#ff8040"),
		"attacks": {
			"flail": {"wind": 0.45, "act": 0.16, "rec": 0.3, "dmg": 18, "tell": "white", "sfx": "whip", "hb": [0, 6, 56, 28]},
			"flail2": {"wind": 0.3, "act": 0.16, "rec": 0.2, "dmg": 18, "tell": "white", "sfx": "whip", "hb": [-10, 0, 66, 22], "next": "stuck"},
			"stuck": {"wind": 0.05, "act": 1.5, "rec": 0.35, "tell": "", "sfx": "crush"},
			"pillars": {"wind": 0.5, "act": 1.75, "rec": 0.5, "tell": "", "sfx": "charge"},
			"smoke": {"wind": 0.4, "act": 0.5, "rec": 0.3, "tell": "", "sfx": "wind"},
			"censer": {"wind": 0.6, "act": 0.1, "rec": 0.6, "tell": "", "sfx": "swing"},
		}}

func exposed() -> bool:
	return (not atk.is_empty() and atk["name"] == "stuck") or super.exposed()

func _think_boss(dt: float) -> void:
	if not atk.is_empty():
		return
	face()
	var d := absf(dx())
	if cool > 0:
		walk(facing if d > 90 else (-facing if d < 40 else 0), 80, dt); return
	var r := randf()
	if d < 70:
		attack("flail2" if r < 0.38 else ("flail" if r < 0.75 else "smoke"))
	elif d < 200:
		attack("pillars" if r < 0.3 else ("censer" if r < 0.55 else ("flail2" if r < 0.75 else "smoke")))
	else:
		attack("pillars" if r < 0.5 else "smoke")

func _act(nm: String, _s: Dictionary) -> void:
	match nm:
		"stuck":
			world.shake(0.25); world.fx.dust(Vector2(cx + facing * 34, bottom - 2), 12)
			if not stuck_hint:
				stuck_hint = true; world.toast(Data.t("tip_vael_stuck"))
		"pillars":
			var x0: float = arena["x0"] + 14; var x1: float = arena["x1"] - 14
			var c := clampf(player.cx, x0 + 60, x1 - 60)
			pyre = {"l": maxf(x0, c - 120), "r": minf(x1, c + 120), "boom": 0.0, "lit": false}
		"smoke":
			world.fx.burst(Vector2(cx, cy), 30, Color(0.67, 0.59, 0.75, 0.5), 120.0)
			pos.x = clampf(player.cx - player.facing * 70 - size.x / 2, 40, world.room.size_px().x - 40 - size.x)
			face(); world.fx.burst(Vector2(cx, cy), 20, Color(0.67, 0.59, 0.75, 0.5), 100.0)
		"censer":
			for i in 3:
				world.spawn_projectile({"pos": Vector2(cx, cy - 10), "vel": Vector2(facing * (120 + i * 70), -260), "grav": 700.0, "size": Vector2(10, 10),
					"dmg": 14.0, "kind": "fire", "color": Color("#ff7020"), "life": 3.0, "fire": true, "on_wall": "fire", "parryable": false})

func _dur(nm: String, _s: Dictionary, dt: float) -> void:
	if nm == "stuck":
		vel.x = 0
		if randf() < 0.08:
			world.fx.dust(Vector2(cx + facing * 34, bottom - 2), 2)
	if nm != "pillars" or pyre.is_empty():
		return
	var fl: float = arena["floor"]
	if atk["t"] < 0.45:
		return
	if not pyre["lit"]:
		pyre["lit"] = true; world.audio.sfx("fire")
	var mid: float = (pyre["l"] + pyre["r"]) / 2.0
	var sp := 150.0 if phase > 0 else 125.0
	if pyre["boom"] > 0:
		pyre["boom"] += dt
		if pyre["boom"] < 0.3:
			attack_boxes.append({"rect": Rect2(mid - 34, fl - 60, 68, 60), "dmg": 22.0, "id": atk["id"] * 10 + 3, "unblockable": true, "parryable": false, "knock": 260.0, "src": self, "fire": true})
		return
	if pyre["r"] - pyre["l"] > 6:
		pyre["l"] = minf(mid, pyre["l"] + sp * dt); pyre["r"] = maxf(mid, pyre["r"] - sp * dt)
	else:
		pyre["boom"] = 0.001; world.shake(0.45); world.audio.sfx("explode", 0.6)
		world.fx.burst(Vector2(mid, fl - 20), 40, Color(1, 0.5, 0.15), 220.0, true)
	for k in [1, 2]:
		var x: float = pyre["l"] if k == 1 else pyre["r"]
		attack_boxes.append({"rect": Rect2(x - 8, fl - 30, 16, 30), "dmg": 18.0, "id": atk["id"] * 10 + k, "unblockable": true, "parryable": false, "knock": 160.0, "src": self, "fire": true})
		if randf() < 0.7:
			world.fx.burst_o(x + randf_range(-6, 6), fl - randf_range(2, 20), 1, {"vx": randf_range(-20, 20), "vy": randf_range(-120, -50), "life": 0.5, "size": randf_range(1.4, 3), "color": ["#ffb040", "#ff5010", "#ffe0a0"].pick_random(), "add": true})

func _on_end(nm: String) -> void:
	match nm:
		"stuck":
			world.audio.sfx("break"); world.fx.burst(Vector2(cx + facing * 34, bottom - 4), 10, Color("#8a8078"), 140.0)
		"pillars":
			pyre = {}
		"flail":
			var s: Dictionary = K["attacks"]["flail"]
			if phase > 0 and randf() < 0.6: s["next"] = "flail2"
			else: s.erase("next")

func damage_mult(_b: Dictionary) -> float:
	return 1.8 if not atk.is_empty() and atk["name"] == "stuck" and atk["phase"] != "wind" else 1.0

func _draw() -> void:
	# muros de fogo da pira (aviso antes de acender)
	if not pyre.is_empty() and not atk.is_empty() and atk["name"] == "pillars" and pyre["boom"] <= 0:
		var fl: float = arena["floor"] - position.y
		for x in [pyre["l"], pyre["r"]]:
			var lx: float = x - position.x
			if atk["t"] < 0.45:
				draw_rect(Rect2(lx - 8, fl - 2, 16, 2), Color(1, 0.38, 0.12, 0.9))
			else:
				for i in 5:
					var ph: float = t * 16.0 + i * 1.7 + x * 0.05
					var hh: float = 22.0 + 12.0 * absf(sin(ph))
					var ox: float = lx + (i - 2) * 3.2
					var c := Color(1, 0.94, 0.78, 0.9) if i == 2 else Color(1, (110 + i * 20) / 255.0, 0.16, 0.7)
					draw_colored_polygon(PackedVector2Array([Vector2(ox - 4.5, fl), Vector2(ox + sin(ph) * 2.5, fl - hh), Vector2(ox + 4.5, fl)]), c)
	super._draw()
