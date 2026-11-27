extends Enemy
## Base dos chefes (porte de js/game/bosses.js): introdução com título, rugido, música e falas; fases por vida
## (+20% de vida uma vez ao entrar na 2.ª), cada fase mais agressiva; onda de choque se for martelado sem parar;
## 3 aparos (4 na 2.ª fase) deixam-no atordoado; ao morrer tomba, desfaz-se em cinza e dá as recompensas.
## Cada chefe é um script boss_<id>.gd que estende este e preenche _def() e _think_boss().

const REWARDS := {
	"matilheira": {"items": [["ash_heart", 1], ["w_navalhas", 1]], "ability": "dashstrike", "ash": 400},
	"caedmon": {"items": [["ember_1", 1], ["r_captain", 1]], "ability": "wall", "ash": 800},
	"automato": {"items": [["relic_slot", 1], ["ash_steel", 2], ["w_malho", 1]], "ash": 600},
	"hilde": {"items": [["ember_2", 1], ["hilde_hammer", 1]], "ability": "forge", "ash": 1000},
	"mariposa": {"ability": "double", "ash": 600},
	"elowen": {"items": [["ember_3", 1], ["candle_fragment", 1], ["elowen_lullaby", 1]], "ability": "counter", "ash": 1100},
	"sineiro": {"items": [["ash_heart", 1], ["helm_sino", 1]], "ability": "instinct", "ash": 800},
	"corvin": {"items": [["ember_4", 1]], "ability": "veil", "ash": 1300},
	"vael": {"items": [["candle_fragment", 1], ["r_ember", 1]], "ash": 1000},
	"ozias": {"items": [["ember_5", 1]], "ash": 1500},
	"gemeos": {"items": [["ash_heart", 1], ["palace_seal", 1]], "ash": 1200},
	"aldric": {"items": [["ember_6", 1], ["w_montante", 1]]},
	"seraphine": {},
	"carpideira": {"items": [["ash_heart", 1], ["candle_fragment", 1]], "ash": 1600},
	"custodio": {"items": [["ash_heart", 1]], "ash": 2500},
}
const PRE := {"caedmon": ["caedmon_pre1", "caedmon_pre2"], "hilde": ["hilde_pre1", "hilde_pre2"], "elowen": ["elowen_pre1", "elowen_pre2"],
	"corvin": ["corvin_pre1", "corvin_pre2"], "ozias": ["ozias_pre1", "ozias_pre2", "ozias_pre3"], "aldric": ["aldric_pre1", "aldric_pre2", "aldric_pre3"],
	"seraphine": ["seraphine_pre1", "seraphine_pre2"]}
const POST := {"vael": ["vael_post"], "gemeos": ["gemeos_post"], "caedmon": ["caedmon_post1", "caedmon_post2"], "hilde": ["hilde_post1", "hilde_post2"],
	"elowen": ["elowen_post1", "elowen_post2"], "corvin": ["corvin_post1", "corvin_post2"], "ozias": ["ozias_post1", "ozias_post2"],
	"aldric": ["aldric_post1", "aldric_post2", "aldric_post3"], "seraphine": ["seraphine_post"], "carpideira": ["carpideira_post"]}
const REPEL := {"wind": 0.36, "act": 0.18, "rec": 0.42, "tell": "red", "armor": true}

var boss_id := ""
var name_key := ""
var music := ""
var phase := 0
var phases: Array = []
var aggr: Array = [1.45, 1.75, 2.1]
var healed := false
var intro := true
var intro_t := 0.0
var intro_time := 1.6
var started := false
var parry_n := 0
var parry_last := -99.0
var dazed := false
var pressure := 0.0
var arena := {}
var anim_map := {}
var spawn_d := {}
var finished := false
var sh_p2: Dictionary = {}
var eye_col := Color(1, 0.7, 0.4)

## cada chefe: {"w","h","hp","music","phases","heavy","attacks":{...}} e opcionalmente "aggr", "anim_map", "eye"
func _def() -> Dictionary:
	return {}

func setup_boss(id: String, d: Dictionary) -> void:
	boss_id = id; spawn_d = d
	kind = "b_" + id; base = id; name_key = "boss_" + id
	var D := _def()
	K = {"cfg": D, "attacks": D.get("attacks", {}), "think": "_think_boss", "heavy": D.get("heavy", true), "center": D.get("center", false)}
	K["attacks"]["_repel"] = REPEL
	size = Vector2(D["w"], D["h"])
	var tx: int = d["x"]; var ty: int = d["y"]
	pos = Vector2(tx * 20 + 10 - size.x / 2, (ty + 1) * 20 - size.y)
	hp = float(D["hp"]); max_hp = hp
	poise = 9999.0; poise_max = poise
	music = D.get("music", "b_" + id)
	phases = D.get("phases", [0.5])
	aggr = D.get("aggr", aggr)
	anim_map = D.get("anim_map", {})
	eye_col = D.get("eye", eye_col)
	team = "enemy"; facing = -1; gravity = 0.0 if D.get("flying", false) else 1350.0
	flying = D.get("flying", false)
	sh = Data.sheet(D.get("sheet", "en_b_" + id))
	if Data.sprites.has("en_b_%s_p2" % id):
		sh_p2 = Data.sheet("en_b_%s_p2" % id)
	cool = 1.2
	home_x = cx
	arena = {"x0": 40.0, "x1": 0.0, "floor": float(d.get("floor", ty + 1)) * 20.0}
	_init_boss()

func _init_boss() -> void:
	pass

func _ready() -> void:
	super._ready()
	arena["x1"] = world.room.size_px().x - 40.0
	eye_light = PointLight2D.new()
	eye_light.texture = world.light_tex
	eye_light.color = eye_col
	eye_light.energy = 0.6
	eye_light.texture_scale = 0.5
	add_child(eye_light)

func is_boss() -> bool:
	return true

func is_heavy() -> bool:
	return K.get("heavy", true)

## janelas de castigo próprias (arfar, derrubado, postura quebrada…): aí bater é merecido, não enche a pressão
func exposed() -> bool:
	return dazed and stagger > 0

## começar o combate (o mundo chama quando a protagonista passa o gatilho)
func begin() -> void:
	intro = true; intro_t = 0.0
	world.audio.sfx("roar", 0.8); world.shake(0.4)
	Audio.play_music(music, 0.4)
	world.hud.banner(Data.t(name_key))
	_intro_start()

func _intro_start() -> void:
	pass

func tick(dt: float) -> void:
	if dead:
		_tick_dead(dt); return
	if intro:
		t += dt; anim += dt
		attack_boxes.clear()
		if not flying:
			physics(dt)
		face()
		_intro_update(dt)
		intro_t += dt
		if intro_t > intro_time and not started:
			started = true
			var lines: Array = []
			for k in PRE.get(boss_id, []):
				lines.append({"s": "boss_" + boss_id, "k": k})
			if lines.is_empty():
				intro = false
			else:
				world.hud.dialogue(lines, [], func(_c = 0): self.intro = false)
		return
	# fases por percentagem de vida
	while phase < phases.size() and hp / max_hp <= phases[phase]:
		phase += 1
		Audio.set_intensity(phase)
		if not healed:
			healed = true
			hp = minf(max_hp, hp + max_hp * 0.2)
			world.fx.burst(Vector2(cx, cy), 26, Color(1, 0.69, 0.31), 140.0, true)
			if not sh_p2.is_empty():
				sh = sh_p2
		world.audio.sfx("roar"); world.shake(0.4); cool = 0.2
		_on_phase(phase)
	# cada fase espera menos entre golpes
	var ag: float = aggr[mini(phase, aggr.size() - 1)]
	if cool > 0:
		cool -= dt * (ag - 1.0)
	K["dmg_mult"] = 1.0 + 0.12 * phase
	pressure = maxf(0.0, pressure - dt * 0.9)
	if pressure >= 4.5 and atk.is_empty() and stagger <= 0 and not exposed():
		pressure = 0.0
		attack("_repel")
		world.audio.sfx("repel_charge", 0.8); world.shake(0.08)
	if dazed and stagger <= 0:
		dazed = false
	super.tick(dt)
	pos.x = clampf(pos.x, 0.0, world.room.size_px().x - size.x)

func _intro_update(_dt: float) -> void:
	pass

func _on_phase(_p: int) -> void:
	pass

func _think_boss(_dt: float) -> void:
	pass

# ------------------------------------------------------------------ golpes
func front_box(dx0: float, dy0: float, w: float, h: float) -> Rect2:
	return Rect2(cx + dx0 if facing > 0 else cx - dx0 - w, bottom - dy0 - h, w, h)

func _on_act(nm: String, s: Dictionary) -> void:
	if nm == "_repel":
		var R := repel_r()
		world.audio.sfx("repel"); world.shake(0.45); world.flash_screen(Color("#ffd8b0"), 0.1)
		world.fx.burst(Vector2(cx, cy), 28, Color(1, 0.75, 0.5), 320.0, true)
		if not flying:
			world.fx.dust(Vector2(cx, bottom - 2), 16)
		if not GameState.flags.get("tip_repel", false):
			GameState.flags["tip_repel"] = true; world.toast(Data.t("tip_repel"))
		return
	world.audio.sfx(String(s.get("sfx", "swing_heavy")))
	_act(nm, s)

func _act(_nm: String, _s: Dictionary) -> void:
	pass

func repel_r() -> float:
	return maxf(size.x, size.y) * 0.5 + 46.0

func _during(nm: String, s: Dictionary, dt: float) -> void:
	if nm == "_repel":
		var R := repel_r()
		attack_boxes.append({"rect": Rect2(cx - R, cy - R, R * 2, R * 2), "dmg": 14.0, "id": atk["id"], "unblockable": true, "parryable": false, "knock": 360.0, "src": self})
		return
	_dur(nm, s, dt)

func _dur(_nm: String, _s: Dictionary, _dt: float) -> void:
	pass

func box(r: Rect2, dmg: float, extra := {}) -> void:
	var b := {"rect": r, "dmg": round(dmg * K.get("dmg_mult", 1.0)), "id": atk["id"] if not atk.is_empty() else Actor.new_attack_id(), "parryable": true, "knock": 180.0, "src": self}
	b.merge(extra, true)
	attack_boxes.append(b)

# ------------------------------------------------------------------ levar
func on_hit(b: Dictionary) -> bool:
	if intro or dead or not hittable:
		return false
	var r = _hit_boss(b)
	if r == null:
		r = super.on_hit(b)
	if r == true and not dead and not b.get("projectile", false) and not exposed():
		pressure += 1.7 if b.get("kind", "") in ["heavy", "riposte"] else 1.0
	return r == true

func on_hit_raw(b: Dictionary) -> bool:
	return super.on_hit(b)

## devolve null para o golpe normal, true/false para tratar à parte
func _hit_boss(_b: Dictionary) -> Variant:
	return null

func on_parried() -> void:
	if dazed and stagger > 0:
		return
	if _parried():
		return
	do_stagger(K["cfg"].get("parry_stagger", 0.7), true)
	vel.x = -facing * 80.0
	if t - parry_last > 8.0:
		parry_n = 0
	parry_last = t; parry_n += 1
	if parry_n >= (4 if phase >= 1 else 3):
		parry_n = 0
		do_stagger(2.4, true); dazed = true
		world.audio.sfx("choir_hit"); world.flash_screen(Color(1, 0.96, 0.88), 0.3); world.hitstop(0.12)

## poça de fogo no chão (queima quem a pisa)
func fire_pool(x: float, w := 40.0, life := 3.5) -> void:
	world.spawn_projectile({"pos": Vector2(x, arena["floor"] - 5), "size": Vector2(w, 9), "dmg": 8.0, "kind": "fire", "color": Color("#ff6010"),
		"life": life, "solid": false, "parryable": false, "fire": true})

## chama um inimigo comum para a arena (matilha, sinos, etc.)
func summon(k: String, x: float) -> void:
	var en = load("res://scripts/enemy.gd").new()
	en.world = world
	en.setup(k, int(x / 20.0), int((bottom - 1) / 20.0))
	en.aggro = true; en.summoned = true; en.ash_drop = 0
	world.actors.add_child(en)
	world.fx.dust(Vector2(en.cx, en.bottom), 10)

func summoned_alive() -> int:
	var n := 0
	for a in world.actors.get_children():
		if a is Enemy and a != self and a.summoned and not a.dead:
			n += 1
	return n

## devolve true se o chefe trata o aparo à sua maneira
func _parried() -> bool:
	return false

# ------------------------------------------------------------------ morte e recompensas
func die() -> void:
	if dead:
		return
	if _lethal():
		return
	dead = true; hittable = false; atk = {}; contact_dmg = 0.0; _death_t = 0.0; attack_boxes.clear()
	hp = 0.0
	for a in world.actors.get_children():
		if a.get_script() == preload("res://scripts/projectile.gd") and a.get("team") == "enemy":
			a.queue_free()
		elif a != self and a is Enemy and a.summoned:
			a.die()
	world.audio.sfx("boss_die"); world.shake(0.8); world.flash_screen(Color.WHITE, 0.6); world.hitstop(0.4)
	Audio.stop_music(1.2)
	world.boss_down(self)

## chefes com várias barras de vida: devolve true se esta "morte" não é a última
func _lethal() -> bool:
	return false

func _tick_dead(dt: float) -> void:
	_death_t += dt; t += dt
	attack_boxes.clear()
	vel.x *= 0.9
	if not flying:
		physics(dt, false)
	else:
		vel.y = minf(vel.y + 200 * dt, 120); pos.y = minf(pos.y + vel.y * dt, arena["floor"] - size.y)
	if _death_t > 1.2:
		world.fx.dissolve(self, "#ffd080")
	elif randf() < 0.4:
		world.fx.burst(Vector2(cx + randf_range(-size.x / 3, size.x / 3), pos.y + randf() * size.y), 1, Color(1, 0.6, 0.25), 40.0, true)
	if _death_t > 2.4 and not finished:
		finished = true
		GameState.bosses[boss_id] = true
		world.fx.burst(Vector2(cx, cy), 40, Color(1, 0.85, 0.6), 160.0, true)
		reward()
		queue_free()

func reward() -> void:
	var R: Dictionary = REWARDS.get(boss_id, {})
	GameState.ash += int(R.get("ash", 0))
	var w = world
	var after := func(_c = 0):
		var i := 0
		for it in R.get("items", []):
			GameState.give(it[0], it[1])
			w.get_tree().create_timer(0.4 + i * 1.6).timeout.connect(func(): if is_instance_valid(w): w.hud.item_get(it[0], it[1]); w.audio.sfx("pickup_big"))
			i += 1
		if R.has("ability"):
			GameState.abilities[R["ability"]] = true
			w.get_tree().create_timer(0.3 + i * 1.6).timeout.connect(func():
				if is_instance_valid(w):
					w.hud.item_get("ab_" + R["ability"]); w.audio.sfx("pickup_big"); w.toast(Data.t("tut_" + R["ability"])))
		GameState.save()
		w.after_boss(boss_id)
	var lines: Array = []
	var sp := "boss_" + boss_id
	for k in POST.get(boss_id, []):
		lines.append({"s": sp, "k": k})
	if lines.is_empty():
		after.call()
	else:
		w.hud.dialogue(lines, [], after)

# ------------------------------------------------------------------ desenho
func _process(delta: float) -> void:
	super._process(delta)
	visible = visible and _death_t < 2.4
	if dead:
		modulate.a = clampf(1.0 - (_death_t - 1.6) / 0.8, 0.0, 1.0)

## estados com pose própria: devolve {} para o normal
func _anim_state() -> Dictionary:
	return {}

func current_frame() -> Dictionary:
	if sh.is_empty():
		return {}
	var A: Dictionary = sh["meta"]["anims"]
	if dead:
		return Data.frame(sh, "death", minf(_death_t * 7.0, A["death"]["frames"].size() - 0.1))
	var st := _anim_state()
	if not st.is_empty() and A.has(st["anim"]):
		if st.has("idx"):
			return Data.frame(sh, st["anim"], st["idx"])
		return _timed(st["anim"])
	if not atk.is_empty() and atk["name"] != "_repel":
		var an: String = anim_map.get(atk["name"], "atk_" + String(atk["name"]))
		if A.has(an):
			var s: Dictionary = atk["s"]
			var d: float = s[atk["phase"]]
			return Data.phase_frame(sh, an, atk["phase"], atk["t"] / maxf(0.001, d))
	return super.current_frame()

func _draw() -> void:
	if dazed and stagger > 0 and not dead:
		for i in 3:
			var a := t * 4.0 + i * TAU / 3.0
			draw_circle(Vector2(cos(a) * 16.0, -size.y - 6 + sin(a) * 4.0), 2.0, Color(1, 0.9, 0.5, 0.9))
	super._draw()
