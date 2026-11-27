extends "res://scripts/boss.gd"
## O AUTÓMATO DO FOLE — subchefe das Forjas (porte de js/game/bosses.js).
## Ponto fraco: a fornalha nas costas (×1,8; ×2,4 em sobreaquecimento, que o faz cambalear).
## Respiradouros: as oito grelhas fixas do chão sopram fogo à vez (ímpares, depois pares) — aprende-se o padrão.

var overheat := 0.0
var steam := {}
var vent_set := 0
var col_xs: Array = []
var back_hint := false
var smoke_t := 0.0

func _def() -> Dictionary:
	return {"w": 40, "h": 60, "hp": 760, "music": "sb_automato", "phases": [0.5], "parry_stagger": 1.2, "aggr": [1.7, 2.1, 2.3], "eye": Color("#ff9a40"),
		"attacks": {
			"punch": {"wind": 0.6, "act": 0.16, "rec": 0.6, "dmg": 22, "tell": "white", "hb": [12, 20, 52, 28], "lunge": 90.0},
			"crush": {"wind": 0.85, "act": 0.15, "rec": 0.9, "dmg": 28, "tell": "red", "hb": [6, 0, 58, 34], "armor": true},
			"bellows": {"wind": 0.7, "act": 0.9, "rec": 0.6, "tell": "", "sfx": "wind"},
			"vents": {"wind": 0.5, "act": 1.7, "rec": 0.6, "tell": "", "sfx": "charge"},
		}}

func exposed() -> bool:
	return overheat > 0 or super.exposed()

func grates() -> Array:
	var out: Array = []
	for i in 8:
		out.append(round(arena["x0"] + (arena["x1"] - arena["x0"]) * (i + 0.5) / 8.0))
	return out

func _think_boss(dt: float) -> void:
	if overheat > 0:
		overheat -= dt
	# jato de vapor do esmagamento: um anel escaldante que cresce à volta dele
	if not steam.is_empty():
		steam["t"] += dt
		var R: float = 18.0 + minf(1.0, steam["t"] / 0.3) * 66.0
		if steam["t"] < 0.42:
			attack_boxes.append({"rect": Rect2(cx - R, bottom - 48, R * 2, 48), "dmg": 16.0, "id": steam["id"], "unblockable": true, "parryable": false, "knock": 200.0, "src": self})
		if steam["t"] < 0.5:
			for i in 2:
				var s2 := -1.0 if randf() < 0.5 else 1.0
				world.fx.burst(Vector2(cx + s2 * R * randf_range(0.6, 1.0), bottom - randf_range(4, 40)), 1, Color(0.92, 0.88, 0.84, 0.35), 110.0)
		if steam["t"] > 0.6:
			steam = {}
	# fumo das chaminés
	smoke_t -= dt
	if smoke_t <= 0:
		smoke_t = 0.12 if overheat > 0 else 0.35
		world.fx.burst(Vector2(cx - facing * 10, pos.y + 4), 1, Color(1, 0.6, 0.3, 0.4) if overheat > 0 else Color(0.25, 0.22, 0.23, 0.5), 30.0)
	if not atk.is_empty():
		return
	face()
	var d := absf(dx())
	# em sobreaquecimento fica parado (dá tempo de passar para trás dele)
	if overheat > 0:
		vel.x = move_toward(vel.x, 0, 400 * dt); return
	if cool > 0:
		walk(facing if d > 80 else 0, 62.0 if phase > 0 else 50.0, dt); return
	var r := randf()
	if d < 70:
		attack("punch" if r < 0.5 else ("crush" if r < 0.8 else "bellows"))
	elif d < 200:
		attack("bellows" if r < 0.45 else "vents")
	else:
		attack("vents")

func _act(nm: String, _s: Dictionary) -> void:
	match nm:
		"crush":
			world.shake(0.5); world.audio.sfx("crush")
			world.fx.dust(Vector2(cx + facing * 44, bottom - 2), 18)
			steam = {"t": 0.0, "id": Actor.new_attack_id()}
			world.audio.sfx("wind")
		"vents":
			vent_set = 0 if vent_set == 1 else 1

func _dur(nm: String, _s: Dictionary, dt: float) -> void:
	match nm:
		"bellows":
			var d: float = (player.cx - cx) * facing
			if d > 0 and d < 220 and absf(player.cy - cy) < 50:
				player.vel.x += facing * 900.0 * dt
				if d < 70:
					box(Rect2(cx if facing > 0 else cx - 70, pos.y + 10, 70, 40), 10, {"parryable": false})
			if randf() < 0.9:
				world.fx.burst(Vector2(cx + facing * 34, bottom - 34 + randf_range(-6, 6)), 1, Color(0.86, 0.78, 0.75, 0.3), 320.0)
		"vents":
			var a := atk
			var G2 := grates()
			var waves: Array = [[0.0, 0.55], [0.85, 1.4]] if phase > 0 else [[0.0, 0.6]]
			col_xs = []
			for wi in waves.size():
				var t0: float = waves[wi][0]; var t1: float = waves[wi][1]
				var xs: Array = []
				for i in G2.size():
					if i % 2 == (vent_set + wi) % 2:
						xs.append(G2[i])
				if a["t"] >= t0 and a["t"] < t1:
					col_xs = xs
					for x in xs:
						if randf() < 0.25:
							world.fx.burst(Vector2(x + randf_range(-6, 6), arena["floor"] - 2), 1, Color(1, 0.5, 0.19), 30.0, true)
				elif a["t"] >= t1 and a["t"] < t1 + 0.4:
					if not a.get("f%d" % wi, false):
						a["f%d" % wi] = true; world.audio.sfx("fire")
					for x in xs:
						if randf() < 0.8:
							world.fx.burst_o(x + randf_range(-6, 6), arena["floor"], 1, {"vx": randf_range(-10, 10), "vy": randf_range(-420, -300), "life": 0.5, "size": randf_range(2, 4), "color": ["#ffb040", "#ff6010"].pick_random(), "add": true})
						attack_boxes.append({"rect": Rect2(x - 11, arena["floor"] - 140, 22, 140), "dmg": 16.0, "id": a["id"] * 100 + wi * 10 + G2.find(x), "unblockable": true, "parryable": false, "knock": 160.0, "src": self, "fire": true})

func _on_end(nm: String) -> void:
	if nm == "vents":
		col_xs = []
		# depois dos respiradouros a fornalha fica em brasa: as costas ficam expostas e muito frágeis
		overheat = 2.2; world.audio.sfx("crackle")

## ponto fraco nas costas
func _hit_boss(b: Dictionary) -> Variant:
	var back: bool = (player.cx - cx) * facing < 0
	if not back:
		return null
	var hot := overheat > 0
	var b2 := b.duplicate(); b2["dmg"] = round(b["dmg"] * (2.4 if hot else 1.8))
	world.fx.burst(Vector2(cx - facing * 8, bottom - 47), 18 if hot else 10, Color(1, 0.69, 0.25), 140.0, true)
	if hot and atk.is_empty() and stagger <= 0:
		stagger = 1.1; overheat = 0.0; world.audio.sfx("stagger"); world.flash_screen(Color("#ffb060"), 0.25)
	if not back_hint:
		back_hint = true; world.toast(Data.t("tip_automato_back"))
	return on_hit_raw(b2)

func _draw() -> void:
	# grelhas fixas do chão (onde sopram os respiradouros) e o aviso a laranja
	var fl: float = arena["floor"] - position.y
	for x in grates():
		var lx: float = x - position.x
		draw_rect(Rect2(lx - 12, fl - 2, 24, 3), Color("#16120f"))
		var hot: bool = col_xs.has(x)
		for i in [-9.0, -4.5, 0.0, 4.5, 9.0]:
			draw_rect(Rect2(lx + i - 0.8, fl - 1.6, 1.6, 1.4), Color(1, 0.43, 0.16, 0.9 if hot else 0.35))
		draw_rect(Rect2(lx - 12, fl - 2.6, 24, 0.8), Color("#4a3c32"))
		if hot:
			draw_rect(Rect2(lx - 10, fl - 140, 20, 138), Color(1, 0.45, 0.15, 0.08 + 0.06 * sin(t * 20.0)))
	super._draw()

func _process(delta: float) -> void:
	super._process(delta)
	if eye_light:
		eye_light.energy = 1.1 if overheat > 0 else 0.6
