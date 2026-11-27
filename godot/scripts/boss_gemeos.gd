extends "res://scripts/boss.gd"
## OS GÉMEOS — dois chefes ao mesmo tempo (porte de js/game/bosses.js). Este script é o mais rápido (gemeo_a,
## espada) e chama o irmão pesado (gemeo_b, maça). Esperam pela vez um do outro; quando um cai, o outro enfurece.
## O pesado acerta no irmão se estiver no caminho (dica: põe um entre ti e o outro). Uma só barra para os dois.

var partner = null
var twin := "a"
var enraged := false
var whirl_dir := 1
var whirl_n := -1
var friend_hint := false
var fallen := false

func _def() -> Dictionary:
	if twin == "b":
		return {"w": 34, "h": 66, "hp": 620, "music": "sb_gemeos", "phases": [], "sheet": "en_b_gemeo_b",
			"attacks": {
				"maul": {"wind": 0.8, "act": 0.15, "rec": 0.8, "dmg": 26, "tell": "red", "hb": [4, 0, 46, 40], "armor": true},
				"sweep": {"wind": 0.65, "act": 1.25, "rec": 0.75, "tell": "red", "armor": true},
			}}
	return {"w": 26, "h": 60, "hp": 540, "music": "sb_gemeos", "phases": [], "sheet": "en_b_gemeo_a",
		"attacks": {
			"cut": {"wind": 0.45, "act": 0.12, "rec": 0.15, "dmg": 16, "tell": "white", "hb": [4, 6, 52, 28], "lunge": 140.0},
			"cut2": {"wind": 0.3, "act": 0.12, "rec": 0.5, "dmg": 16, "tell": "white", "hb": [4, 4, 52, 32], "lunge": 140.0},
			"dash": {"wind": 0.5, "act": 0.25, "rec": 0.6, "dmg": 18, "tell": "white", "hb": [0, 10, 48, 20], "lunge": 420.0},
		}}

func setup_boss(id: String, d: Dictionary) -> void:
	var d2 := d.duplicate(); d2["x"] = int(d["x"]) + (3 if twin == "b" else -3)
	super.setup_boss(id, d2)
	name_key = "boss_gemeos"; boss_id = "gemeos"

func _ready() -> void:
	super._ready()
	if twin == "a":
		# o irmão pesado entra no mesmo combate
		partner = load("res://scripts/boss_gemeos.gd").new()
		partner.twin = "b"; partner.world = world; partner.partner = self
		partner.setup_boss("gemeos", spawn_d)
		partner.visible = false
		world.actors.add_child.call_deferred(partner)

## barra única: a vida dos dois
func bar_hp() -> float:
	var a := maxf(0.0, hp); var m := max_hp
	if partner != null and is_instance_valid(partner):
		a += maxf(0.0, partner.hp); m += partner.max_hp
	return a / m

func begin() -> void:
	super.begin()
	if partner != null and is_instance_valid(partner):
		partner.visible = true

var go := false
func tick(dt: float) -> void:
	# o irmão pesado só começa quando o primeiro acaba a introdução
	if twin == "a" and partner != null and is_instance_valid(partner) and not intro and not partner.go:
		partner.go = true; partner.intro = false; partner.started = true
	if twin == "b" and not go and not dead:
		attack_boxes.clear(); physics(dt); face(); return
	super.tick(dt)

func _waiting() -> bool:
	return partner != null and is_instance_valid(partner) and not partner.dead and not partner.atk.is_empty() and not enraged

func _think_boss(dt: float) -> void:
	if not atk.is_empty():
		return
	face()
	var d := absf(dx())
	if twin == "a":
		if cool > 0 or _waiting():
			walk(facing if d > 70 else (-facing if d < 40 else 0), 70, dt); return
		attack("cut" if d < 60 else "dash")
	else:
		if cool > 0 or _waiting():
			walk(facing if d > 60 else 0, 40, dt); return
		attack("sweep" if d < 130 and randf() < 0.45 else "maul")

func _act(nm: String, _s: Dictionary) -> void:
	match nm:
		"maul":
			world.shake(0.4); world.audio.sfx("crush")
			world.fx.dust(Vector2(cx + facing * 40, bottom - 2), 14)
			_brother_hit(front(4, 0, 46, 40), 70, 2.4)
		"sweep":
			whirl_dir = facing; whirl_n = -1

func _dur(nm: String, _s: Dictionary, _dt: float) -> void:
	if nm == "sweep":
		var n := int(atk["t"] / 0.32)
		vel.x = whirl_dir * (175.0 if enraged else 140.0)
		facing = (-1 if int(atk["t"] / 0.16) % 2 else 1) * whirl_dir
		var r := Rect2(cx - 44, bottom - 40, 88, 36)
		attack_boxes.append({"rect": r, "dmg": 16.0, "id": atk["id"] * 10 + n, "unblockable": true, "parryable": false, "knock": 200.0, "src": self})
		if n != whirl_n:
			whirl_n = n; world.audio.sfx("swing_heavy", 0.6); _brother_hit(r, 40, 1.6)
		if wall_ahead(whirl_dir):
			atk["t"] = 99.0

func _on_end(nm: String) -> void:
	match nm:
		"cut":
			var s: Dictionary = K["attacks"]["cut"]
			if randf() < 0.6 + (0.3 if enraged else 0.0): s["next"] = "cut2"
			else: s.erase("next")
		"sweep":
			facing = whirl_dir

func attack(nm: String) -> void:
	super.attack(nm)
	if nm == "maul" and not friend_hint and partner != null and is_instance_valid(partner) and not partner.dead:
		friend_hint = true; world.toast(Data.t("tip_gemeos_friendly"))

## a maça do pesado acerta no irmão se estiver no caminho
func _brother_hit(r: Rect2, dmg: float, stag: float) -> void:
	var o = partner
	if o == null or not is_instance_valid(o) or o.dead or not r.intersects(Rect2(o.pos, o.size)):
		return
	o.hp = maxf(1.0, o.hp - dmg); o.flash = 0.2; o.last_hit_t = 0.0; o.atk = {}
	o.do_stagger(stag, true); o.vel.x = facing * 220.0
	world.shake(0.5); world.hitstop(0.1); world.audio.sfx("hit_metal")

func _anim_state() -> Dictionary:
	if not atk.is_empty() and atk["name"] == "sweep" and atk["phase"] == "act":
		return {"anim": "atk_sweep", "idx": fmod(atk["t"] / 0.16, 1.0) * 3.0}
	return {}

## o primeiro a cair não acaba o combate: o outro enfurece; o último dá as recompensas
func _lethal() -> bool:
	if partner != null and is_instance_valid(partner) and not partner.dead:
		dead = true; hittable = false; atk = {}; attack_boxes.clear(); hp = 0.0; _death_t = 0.0; fallen = true
		world.audio.sfx("boss_die"); world.shake(0.5); world.audio.sfx("roar")
		partner.enraged = true; Audio.set_intensity(2)
		if twin == "a":
			# o irmão passa a ser o chefe principal (barra, morte e recompensas)
			world.boss = partner; world.hud.boss = partner
			partner.partner = null
		return true
	return false

func _tick_dead(dt: float) -> void:
	if fallen:
		_death_t += dt; t += dt; attack_boxes.clear(); vel.x *= 0.9; physics(dt, false)
		if _death_t > 1.2: world.fx.dissolve(self, "#ffd080")
		if _death_t > 2.4: queue_free()
		return
	super._tick_dead(dt)
