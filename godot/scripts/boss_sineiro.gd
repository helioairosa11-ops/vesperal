extends "res://scripts/boss.gd"
## O SINEIRO — subchefe da Torre (porte de js/game/bosses.js). Fraqueza: aparar o balanço — o sino bate-lhe
## na cabeça e o toque atordoa-o muito mais tempo. Toque do sino solta ondas; o pisão faz cair destroços.

var debris: Array = []
var parry_hint := false

func _def() -> Dictionary:
	return {"w": 34, "h": 58, "hp": 720, "music": "sb_sineiro", "phases": [0.5], "aggr": [1.65, 2.0, 2.2], "eye": Color("#ffd080"),
		"attacks": {
			"swing": {"wind": 0.7, "act": 0.4, "rec": 0.6, "dmg": 24, "tell": "white", "hb": [6, 2, 44, 34]},
			"ring": {"wind": 0.9, "act": 0.1, "rec": 0.7, "tell": "", "sfx": "bell"},
			"stomp": {"wind": 0.6, "act": 0.1, "rec": 0.6, "tell": "", "sfx": "crush"},
			"charge": {"wind": 0.6, "act": 0.6, "rec": 0.6, "dmg": 20, "tell": "red", "lunge": 300.0, "sfx": "roar", "hb": [0, 0, 34, 58]},
		}}

func _think_boss(dt: float) -> void:
	for d in debris:
		d["t"] -= dt
		if d["t"] <= 0:
			world.spawn_projectile({"pos": Vector2(d["x"], world.cam.get_screen_center_position().y - 190), "vel": Vector2(0, 200), "grav": 900.0,
				"size": Vector2(14, 14), "dmg": 16.0, "kind": "clod", "life": 3.0, "parryable": false})
	debris = debris.filter(func(d): return d["t"] > 0)
	if not atk.is_empty():
		return
	face()
	var d2 := absf(dx())
	if cool > 0:
		walk(facing if d2 > 70 else 0, 70.0 if phase > 0 else 55.0, dt); return
	var r := randf()
	if d2 < 90:
		attack("swing" if r < 0.6 else "stomp")
	else:
		attack("ring" if r < 0.35 else ("charge" if r < 0.65 else ("stomp" if r < 0.8 else "swing")))

func _act(nm: String, _s: Dictionary) -> void:
	match nm:
		"swing":
			world.shake(0.3); world.audio.sfx("bell_small")
		"ring":
			world.shake(0.4)
			var mx := cx + facing * 36
			for sd in [-1, 1]:
				for hh in [0, 1]:
					world.spawn_projectile({"pos": Vector2(mx, bottom - (46 if hh else 14)), "vel": Vector2(sd * (150 if hh else 210), 0), "size": Vector2(12, 26),
						"dmg": 14.0, "kind": "wave", "color": Color("#ffe0a0"), "life": 3.0})
		"stomp":
			world.shake(0.5); world.fx.dust(Vector2(cx + facing * 14, bottom - 2), 14)
			var W: float = world.room.size_px().x
			for i in (7 if phase > 0 else 4):
				debris.append({"x": randf_range(60, W - 60), "t": 0.8 + i * 0.15})

func _parried() -> bool:
	if not atk.is_empty() and atk["name"] == "swing":
		do_stagger(2.3, true); vel.x = -facing * 60.0
		world.audio.sfx("bell"); world.audio.sfx("choir_hit", 0.5); world.shake(0.5); world.flash_screen(Color("#fff0c0"), 0.25)
		world.toast(Data.t("tip_sineiro_dazed" if parry_hint else "tip_sineiro_parry")); parry_hint = true
		return true
	return false

func damage_mult(_b: Dictionary) -> float:
	return 1.3 if stagger > 0 and parried else 1.0

func _draw() -> void:
	for d in debris:
		draw_set_transform(Vector2(d["x"] - position.x, arena["floor"] - position.y - 1), 0, Vector2(1, 0.28))
		draw_circle(Vector2.ZERO, 9.0, Color(0, 0, 0, maxf(0.0, 0.5 - d["t"] * 0.3)))
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
	super._draw()
