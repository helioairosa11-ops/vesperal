extends "res://scripts/boss.gd"
## AMA ELOWEN — a ama das silvas (porte de js/game/bosses2.js). Rápida, nunca fica plantada: enterra-se e corre
## por baixo do chão atrás de ti e irrompe (aviso no chão); ondas de raízes, anel de espinhos, chicote de silvas,
## investida, sementes que rebentam em pó. A canção de embalar (lullaby) abranda — bate-lhe enquanto canta e ela cala-se.

var sink := 0.0
var bur := {}
var rw := {}
var rings: Array = []
var th_x: Array = []
var lull_r := 0.0
var lull_on := false

func _def() -> Dictionary:
	return {"w": 32, "h": 68, "hp": 1100, "music": "b_elowen", "phases": [0.5], "aggr": [1.6, 2.0, 2.2], "eye": Color("#c8f0b0"),
		"anim_map": {"burrow": "atk_thorns", "rootwave": "atk_thorns", "thornring": "atk_lullaby", "whip2": "atk_whip", "spores": "atk_seeds", "vinedash": "atk_whip"},
		"attacks": {
			"burrow": {"wind": 0.48, "act": 3.2, "rec": 0.4, "tell": "red", "sfx": "burrow"},
			"rootwave": {"wind": 0.55, "act": 1.6, "rec": 0.45, "tell": "", "sfx": "root_burst"},
			"thornring": {"wind": 0.52, "act": 0.3, "rec": 0.55, "tell": "red", "sfx": "thorn_ring"},
			"whip": {"wind": 0.46, "act": 0.18, "rec": 0.42, "dmg": 18, "tell": "white", "sfx": "whip", "hb": [26, 38, 112, 18]},
			"whip2": {"wind": 0.3, "act": 0.18, "rec": 0.5, "dmg": 18, "tell": "white", "sfx": "whip", "hb": [22, 14, 104, 20]},
			"vinedash": {"wind": 0.55, "act": 0.8, "rec": 0.45, "tell": "red", "sfx": "whip"},
			"spores": {"wind": 0.5, "act": 0.1, "rec": 0.55, "tell": "", "sfx": "swing"},
			"thorns": {"wind": 0.4, "act": 1.2, "rec": 0.5, "tell": "", "sfx": "whip"},
			"lullaby": {"wind": 1.35, "act": 0.1, "rec": 0.6, "tell": "", "sfx": "choir_hit"},
		}}

func _think_boss(dt: float) -> void:
	_tick_rings(dt)
	if lull_on:
		lull_r += 160.0 * dt
		var d0 := Vector2(player.cx - cx, player.cy - cy).length()
		if absf(d0 - lull_r) < 14 and player.action.get("type", "") != "dodge":
			player.vel.x *= 0.4   # a canção pesa: abranda quem apanha
			if player.get("slow_t") != null: player.slow_t = 2.2
		if lull_r > 420: lull_on = false
	hittable = sink < 0.6
	if not atk.is_empty():
		if atk["name"] == "burrow" and atk["phase"] == "wind":
			sink = minf(1.0, atk["t"] / 0.48)
			if randf() < 0.8: world.fx.dust(Vector2(cx + randf_range(-18, 18), arena["floor"] - 2), 1)
		if atk["name"] == "lullaby": vel.x = 0
		return
	if sink > 0: sink = maxf(0.0, sink - dt * 4)
	face()
	var d := absf(dx())
	if cool > 0:
		var dir: int = -facing if d < 90 else (facing if d > 170 else (facing if sin(anim * 1.7) > 0.55 else 0))
		walk(dir, 150.0 if phase > 0 else 125.0, dt); return
	var r := randf()
	if d > 210:
		attack("burrow" if r < 0.42 else ("vinedash" if r < 0.66 else ("spores" if r < 0.84 else "rootwave")))
	elif d < 80:
		attack("whip" if r < 0.36 else ("thornring" if r < 0.6 else ("burrow" if r < 0.84 else ("rootwave" if r < 0.93 else "lullaby"))))
	else:
		attack("rootwave" if r < 0.22 else ("burrow" if r < 0.42 else ("whip" if r < 0.56 else ("thorns" if r < 0.68 else ("spores" if r < 0.8 else ("vinedash" if r < 0.9 else "lullaby"))))))

func _act(nm: String, _s: Dictionary) -> void:
	match nm:
		"burrow":
			sink = 1.0; bur = {"ph": "travel", "t": 0.0}
		"rootwave":
			rw = {"x0": cx, "k": 0, "t": 0.0, "cols": []}; world.shake(0.3)
		"thornring":
			rings.append({"x": cx, "y": cy + 8, "r": 14.0, "sp": 310.0 if phase > 0 else 260.0, "max": 150.0 if phase > 0 else 128.0, "id": Actor.new_attack_id()})
			world.shake(0.35)
		"vinedash":
			atk["dir"] = facing; world.audio.sfx("wind", 0.6)
		"spores":
			var n := 4 if phase > 0 else 3
			for i in n:
				var tx := clampf(player.cx + (i - (n - 1) / 2.0) * 56 + randf_range(-10, 10), arena["x0"] + 10, arena["x1"] - 10)
				world.spawn_projectile({"pos": Vector2(cx + facing * 14, pos.y + 26), "vel": Vector2((tx - cx) / 0.85, -320), "grav": 720.0, "size": Vector2(10, 10),
					"dmg": 10.0, "kind": "seed", "color": Color("#a0c060"), "life": 3.0})
		"thorns":
			th_x = []
			for o in [-40, 0, 40]:
				th_x.append(clampf(player.cx + o, 30, world.room.size_px().x - 30))
		"lullaby":
			lull_r = 10.0; lull_on = true

func _dur(nm: String, _s: Dictionary, dt: float) -> void:
	var fl: float = arena["floor"]
	match nm:
		"burrow":
			if bur.is_empty(): return
			bur["t"] += dt
			if bur["ph"] == "travel":
				var ddx: float = player.cx - cx
				vel.x = signf(ddx) * minf(absf(ddx) * 9.0, 340.0 if phase > 0 else 280.0)
				if randf() < 0.7: world.fx.dust(Vector2(cx + randf_range(-14, 14), fl - 2), 1)
				if (absf(ddx) < 6 and bur["t"] > 0.25) or bur["t"] > (0.95 if phase > 0 else 1.2):
					bur["ph"] = "warn"; bur["t"] = 0.0; vel.x = 0; world.audio.sfx("rumble", 0.75)
			elif bur["ph"] == "warn":
				vel.x = 0
				if randf() < 0.6: world.fx.burst(Vector2(cx + randf_range(-30, 30), fl - 2), 1, Color("#c8e090"), 60.0, true)
				if bur["t"] > (0.34 if phase > 0 else 0.44):
					bur["ph"] = "erupt"; bur["t"] = 0.0; bur["id"] = Actor.new_attack_id()
					world.audio.sfx("root_burst"); world.shake(0.55); world.fx.dust(Vector2(cx, fl - 4), 26)
			else:
				sink = maxf(0.0, 1.0 - bur["t"] / 0.26)
				if bur["t"] < 0.28:
					attack_boxes.append({"rect": Rect2(cx - 48, fl - 84, 96, 84), "dmg": 22.0, "id": bur["id"], "unblockable": true, "parryable": false, "knock": 300.0, "src": self})
				if bur["t"] > 0.32:
					sink = 0.0; atk["t"] = 99.0
		"rootwave":
			if rw.is_empty(): return
			rw["t"] += dt
			var step := 0.055 if phase > 0 else 0.07
			while rw["t"] > (rw["k"] + 1) * step and rw["k"] < 24:
				rw["k"] += 1
				for sd in [-1, 1]:
					var x: float = rw["x0"] + sd * rw["k"] * 34
					if x > arena["x0"] - 12 and x < arena["x1"] + 12:
						rw["cols"].append({"x": x, "t": 0.0, "id": Actor.new_attack_id()})
			for c in rw["cols"]:
				c["t"] += dt
				if c["t"] < 0.2:
					if randf() < 0.3: world.fx.dust(Vector2(c["x"] + randf_range(-8, 8), fl - 2), 1)
				elif c["t"] < 0.44:
					attack_boxes.append({"rect": Rect2(c["x"] - 11, fl - 48, 22, 48), "dmg": 16.0, "id": c["id"], "unblockable": true, "parryable": false, "knock": 180.0, "src": self})
		"vinedash":
			var dd: int = atk["dir"]
			vel.x = dd * (470.0 if phase > 0 else 420.0); facing = dd
			attack_boxes.append({"rect": Rect2(pos.x - 4, pos.y + 10, size.x + 8, size.y - 10), "dmg": 20.0, "id": atk["id"], "unblockable": true, "parryable": false, "knock": 240.0, "src": self})
			if randf() < 0.8: world.fx.burst(Vector2(cx - dd * 14, pos.y + randf_range(10, size.y)), 1, Color("#5a7a32"), 80.0)
			if wall_ahead(dd) or (pos.x + size.x >= arena["x1"] - 4 if dd > 0 else pos.x <= arena["x0"] + 4):
				atk["t"] = 99.0
		"thorns":
			var k: float = atk["t"]
			for i in th_x.size():
				var x: float = th_x[i]
				if k < 0.5:
					if randf() < 0.2: world.fx.dust(Vector2(x + randf_range(-8, 8), fl - 2), 1)
				elif k < 0.9:
					attack_boxes.append({"rect": Rect2(x - 10, fl - 56, 20, 56), "dmg": 16.0, "id": atk["id"] * 10 + i, "unblockable": true, "parryable": false, "knock": 180.0, "src": self})

func _on_end(nm: String) -> void:
	match nm:
		"burrow":
			bur = {}; sink = 0.0
			var s: Dictionary = K["attacks"]["burrow"]
			if phase > 0 and not s.has("chain") and randf() < 0.45: s["next"] = "burrow"; s["chain"] = true
			else: s.erase("next"); s.erase("chain")
		"rootwave":
			rw = {}
		"vinedash":
			vel.x = 0
		"thorns":
			th_x = []
		"whip":
			var s2: Dictionary = K["attacks"]["whip"]
			if phase > 0 and randf() < 0.6: s2["next"] = "whip2"
			else: s2.erase("next")

## anel de espinhos que cresce à volta dela
func _tick_rings(dt: float) -> void:
	for g in rings:
		g["r"] += g["sp"] * dt
		var n := maxi(14, roundi(g["r"] / 7.0))
		for i in n:
			var a := i / float(n) * TAU
			var p := Vector2(g["x"] + cos(a) * g["r"], g["y"] + sin(a) * g["r"])
			if world.room.solid_at(p): continue
			attack_boxes.append({"rect": Rect2(p - Vector2(6, 6), Vector2(12, 12)), "dmg": 18.0, "id": g["id"], "unblockable": true, "parryable": false, "knock": 200.0, "src": self})
	rings = rings.filter(func(g): return g["r"] <= g["max"])

## cantar deixa-a exposta: um golpe a meio da canção cala-a e atordoa-a
func damage_mult(_b: Dictionary) -> float:
	if not atk.is_empty() and atk["name"] == "lullaby" and atk["phase"] == "wind":
		atk = {}; stagger = 1.6; cool = 0.6; world.audio.sfx("stagger"); world.audio.sfx("glass", 0.5)
		world.toast(Data.t("tip_elowen_broken"))
		return 1.6
	return 1.3 if stagger > 0 else 1.0

func _draw() -> void:
	var fl: float = arena["floor"] - position.y
	# anéis de espinhos e da canção
	for g in rings:
		var c := Vector2(g["x"], g["y"]) - position
		var k: float = 1.0 - g["r"] / g["max"]
		draw_arc(c, g["r"] - 3, 0, TAU, 48, Color(0.59, 0.86, 0.43, 0.42 * k + 0.08), 6.0)
		var n := maxi(16, roundi(g["r"] / 6.0))
		for i in n:
			var a := i / float(n) * TAU
			var d := Vector2(cos(a), sin(a)); var nn := Vector2(-d.y, d.x)
			var r0: float = g["r"] - 5; var L := 12.0 + (i % 3) * 4.0
			draw_colored_polygon(PackedVector2Array([c + d * r0 - nn * 3.2, c + d * (r0 + L), c + d * r0 + nn * 3.2]), Color(0.12, 0.16, 0.07, 0.8 * k + 0.2))
	if lull_on:
		draw_arc(Vector2(0, cy - bottom), lull_r, 0, TAU, 64, Color(0.78, 0.94, 0.7, 0.35), 3.0)
	# raízes a sair do chão (onda de raízes e espinhos)
	if not rw.is_empty():
		for c2 in rw["cols"]:
			if c2["t"] >= 0.2 and c2["t"] < 0.5:
				_spike(c2["x"] - position.x, fl, 48.0 * minf(1.0, (c2["t"] - 0.2) / 0.08))
	if not atk.is_empty() and atk["name"] == "thorns":
		for x in th_x:
			if atk["t"] >= 0.5 and atk["t"] < 0.95:
				_spike(x - position.x, fl, 56.0 * minf(1.0, (atk["t"] - 0.5) / 0.08))
			elif atk["t"] < 0.5:
				draw_rect(Rect2(x - position.x - 9, fl - 2, 18, 2), Color(0.6, 0.85, 0.4, 0.8))
	# enterrada: só se vê a terra a mexer
	if sink > 0.6:
		for i in 3:
			draw_set_transform(Vector2(0, fl), 0, Vector2(1, 0.3))
			draw_circle(Vector2(sin(t * 9 + i) * 2, 0), 22.0 - i * 6, [Color("#2e241c"), Color("#3e3226"), Color("#54463a")][i])
		draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
		return
	super._draw()

func _spike(x: float, fl: float, h: float) -> void:
	if h <= 1: return
	for i in 3:
		var bx := x + (i - 1) * 7.0
		var hh := h * (0.62 + 0.15 * i)
		draw_colored_polygon(PackedVector2Array([Vector2(bx - 5, fl), Vector2(bx + (i - 1) * 3, fl - hh), Vector2(bx + 5, fl)]), Color("#18200e"))
		draw_colored_polygon(PackedVector2Array([Vector2(bx - 2, fl), Vector2(bx + (i - 1) * 3, fl - hh), Vector2(bx + 1, fl)]), Color("#4e6428"))
