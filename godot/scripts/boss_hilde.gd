extends "res://scripts/boss.gd"
## MESTRA HILDE, A FERREIRA (porte de js/game/bosses2.js).
## Cada golpe aquece o malho; à terceira o cabo queima-lhe as mãos — larga-o e fica exposta (×1,8).
## Tenaz em brasa presa a uma corrente: se te apanha, puxa-te e segue-se a martelada. Bigorna cai do teto onde estás.
## Fase 2: erupção — colunas de fogo que atravessam a forja.

const HEAT_MAX := 3
var heat := 0
var must_cool := false
var pull_hammer := 0.0
var tong := {}
var anvil_x := -1.0
var cols: Array = []
var heat_hint := false

func _def() -> Dictionary:
	return {"w": 30, "h": 62, "hp": 1050, "music": "b_hilde", "phases": [0.5], "aggr": [1.65, 2.0, 2.2], "eye": Color("#ffa040"),
		"attacks": {
			"hammer": {"wind": 0.7, "act": 0.14, "rec": 0.7, "dmg": 24, "tell": "white", "hb": [12, 0, 44, 58]},
			"sweep": {"wind": 0.55, "act": 0.2, "rec": 0.55, "dmg": 20, "tell": "white", "hb": [-14, 0, 72, 32], "lunge": 80.0},
			"ingots": {"wind": 0.55, "act": 0.95, "rec": 0.5, "tell": "white", "sfx": "whip"},
			"anvil": {"wind": 0.4, "act": 1.2, "rec": 0.5, "tell": "", "sfx": "chime"},
			"eruption": {"wind": 0.5, "act": 2.4, "rec": 0.7, "tell": "", "sfx": "roar"},
			"overheat": {"wind": 0.25, "act": 1.9, "rec": 0.45, "tell": "", "sfx": "crackle"},
		}}

func exposed() -> bool:
	return (not atk.is_empty() and atk["name"] == "overheat") or super.exposed()

func _heat() -> void:
	heat += 1
	if heat >= HEAT_MAX:
		must_cool = true

func _think_boss(dt: float) -> void:
	_tick_cols(dt)
	if not atk.is_empty():
		return
	face()
	var d := absf(dx())
	if pull_hammer > 0:
		pull_hammer -= dt
		if pull_hammer <= 0:
			attack("hammer")
		return
	if must_cool:
		attack("overheat"); return
	if cool > 0:
		walk(facing if d > 80 else (-facing if d < 40 else 0), 78.0 if phase > 0 else 62.0, dt); return
	var r := randf()
	if phase > 0 and r < 0.18:
		attack("eruption"); return
	if d < 70:
		attack("hammer" if r < 0.5 else "sweep")
	elif d < 220:
		attack("ingots" if r < 0.5 else "anvil")
	else:
		attack("ingots" if r < 0.6 else "anvil")

func _on_phase(_p: int) -> void:
	cool = 0.0; world.shake(0.5)

func _act(nm: String, _s: Dictionary) -> void:
	match nm:
		"hammer":
			world.shake(0.45); world.audio.sfx("crush")
			world.fx.dust(Vector2(cx + facing * 40, bottom - 2), 16)
			fire_pool(cx + facing * 40)
			_heat()
		"sweep":
			_heat()
		"ingots":
			tong = {"x": cx + facing * 20, "dir": facing, "back": false, "t": 0.0, "id": Actor.new_attack_id()}
		"anvil":
			anvil_x = player.cx
		"eruption":
			world.shake(0.4); world.audio.sfx("crush"); _heat()
			var W: float = world.room.size_px().x
			atk["edir"] = 1 if player.cx > W / 2.0 else -1
		"overheat":
			heat = 0; must_cool = false
			world.audio.sfx("fire", 0.6)
			world.fx.burst(Vector2(cx + facing * 22, bottom - 4), 18, Color(1, 0.8, 0.5), 120.0, true)
			if not heat_hint:
				heat_hint = true; world.toast(Data.t("tip_hilde_heat"))

func _dur(nm: String, _s: Dictionary, dt: float) -> void:
	match nm:
		"ingots":
			if tong.is_empty():
				return
			tong["t"] += dt
			if tong["t"] > 0.42 and not tong["back"]:
				tong["back"] = true
			var sp: float = 430.0 * (-1.15 if tong["back"] else 1.0)
			tong["x"] += tong["dir"] * sp * dt
			var r := Rect2(tong["x"] - 6, bottom - 35, 12, 10)
			if not tong.get("hit", false) and r.intersects(player.hurtbox()) and player.get("iframes") <= 0:
				tong["hit"] = true
				player.receive({"rect": r, "dmg": 10.0, "id": tong["id"], "parryable": true, "knock": 0.0, "src": self})
				if not player.dead and player.action.get("type", "") != "parry":
					player.vel.x = -tong["dir"] * 520.0; player.vel.y = -150.0
					pull_hammer = 0.35; world.audio.sfx("hit_metal")
			if tong["back"] and (tong["x"] - cx) * tong["dir"] < 10:
				tong = {}; atk["t"] = 99.0
		"anvil":
			if atk["t"] >= 0.8 and not atk.get("dropped", false):
				atk["dropped"] = true
				world.spawn_projectile({"pos": Vector2(anvil_x, world.cam.get_screen_center_position().y - 190), "vel": Vector2(0, 500), "grav": 1400.0,
					"size": Vector2(30, 20), "dmg": 30.0, "kind": "anvil", "color": Color("#ff7020"), "life": 2.0, "parryable": false, "on_wall": "fire"})
				anvil_x = -1.0
		"eruption":
			var k := int(atk["t"] / 0.28)
			if k != atk.get("lk", -1):
				atk["lk"] = k
				var W: float = world.room.size_px().x
				var x: float = 40.0 + k * 90.0 if atk["edir"] > 0 else W - 40.0 - k * 90.0
				cols.append({"x": x, "t": 0.0, "id": Actor.new_attack_id()})
		"overheat":
			if randf() < 0.5:
				world.fx.burst(Vector2(cx + facing * 18, bottom - 40), 1, Color(0.8, 0.75, 0.7, 0.35), 40.0)

## colunas de fogo da erupção: 0,5 s de aviso, depois queimam
func _tick_cols(dt: float) -> void:
	for c in cols:
		c["t"] += dt
		if c["t"] < 0.5:
			if randf() < 0.4:
				world.fx.burst(Vector2(c["x"] + randf_range(-10, 10), arena["floor"] - 2), 1, Color(1, 0.5, 0.2), 40.0, true)
		elif c["t"] < 0.85:
			if not c.get("snd", false):
				c["snd"] = true; world.audio.sfx("fire", 0.5)
			attack_boxes.append({"rect": Rect2(c["x"] - 14, arena["floor"] - 120, 28, 120), "dmg": 18.0, "id": c["id"], "unblockable": true, "parryable": false, "knock": 160.0, "src": self, "fire": true})
			for i in 2:
				world.fx.burst_o(c["x"] + randf_range(-10, 10), arena["floor"], 1, {"vx": randf_range(-20, 20), "vy": randf_range(-380, -220), "life": 0.5, "size": randf_range(2, 4), "color": ["#ffb040", "#ff6010"].pick_random(), "add": true})
	cols = cols.filter(func(c): return c["t"] < 0.9)

func damage_mult(_b: Dictionary) -> float:
	if not atk.is_empty() and atk["name"] == "overheat" and atk["phase"] != "wind":
		return 1.8
	return 1.0

func _draw() -> void:
	# corrente da tenaz, sombra da bigorna e aviso das colunas
	if not tong.is_empty():
		var h := Vector2(facing * 20, -40)
		var tp := Vector2(tong["x"] - position.x, -30)
		for i in 14:
			var k := (i + 0.5) / 14.0
			var p := h.lerp(tp, k) + Vector2(0, sin(k * PI) * 6)
			draw_circle(p, 1.3, Color("#2a2420"))
		draw_rect(Rect2(tp - Vector2(6, 5), Vector2(12, 10)), Color("#ff8030"))
	if anvil_x >= 0:
		draw_rect(Rect2(anvil_x - position.x - 16, arena["floor"] - position.y - 3, 32, 3), Color(1, 0.2, 0.1, 0.5 + 0.3 * sin(t * 18)))
	for c in cols:
		if c["t"] < 0.5:
			draw_rect(Rect2(c["x"] - position.x - 12, arena["floor"] - position.y - 2, 24, 2), Color(1, 0.4, 0.1, 0.8))
	# a cabeça do malho aquece: laranja → amarelo → branco
	var kk := 1.2 if (not atk.is_empty() and atk["name"] == "overheat") else float(heat) / HEAT_MAX
	if kk > 0.05 and not dead:
		draw_circle(Vector2(facing * 14, -30), 6 + kk * 5, Color(1, 0.6 + kk * 0.3, 0.3 + kk * 0.4, 0.35 * kk))
	super._draw()
