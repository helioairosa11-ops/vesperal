extends Node
## Estado da partida (vida, cinza, chefes vencidos, altar) e gravação em user://save.json

var max_hp := 100
var hp := 100
var flasks := 3
var max_flasks := 3
var ash := 0
var lume := 0.0
var bosses: Dictionary = {}
var flags: Dictionary = {}
var abilities: Dictionary = {"dash": false, "double": false}
var room := "r1_wake"
var spawn := Vector2(-1, -1)
var altar_room := ""
var buffs: Dictionary = {}   # efeitos com tempo: oil (golpes +30%), incense (dano recebido -30%)
# inventário (como o GameState do jogo web): itens contáveis, armas, relíquias e ranhuras
var items: Dictionary = {}
var weapons: Array = ["desperto"]
var weapon_id := "desperto"
var relics: Array = []
var equipped: Array = []
var relic_slots := 2

const SLOTS := 3
var slot := 0
var play_time := 0.0
var deaths := 0

func slot_path(i: int) -> String:
	return "user://save_%d.json" % i

## ficha de uma memória (para o ecrã das memórias): região, tempo, brasas, conclusão
func slot_meta(i: int) -> Dictionary:
	if not FileAccess.file_exists(slot_path(i)):
		return {}
	var d = JSON.parse_string(FileAccess.get_file_as_string(slot_path(i)))
	return d if typeof(d) == TYPE_DICTIONARY else {}

func last_slot() -> int:
	var best := -1; var bt := -1
	for i in SLOTS:
		var m := slot_meta(i)
		if not m.is_empty() and int(m.get("saved_at", 0)) > bt:
			bt = int(m.get("saved_at", 0)); best = i
	return best

func erase(i: int) -> void:
	if FileAccess.file_exists(slot_path(i)):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(slot_path(i)))

func completion() -> int:
	return clampi(int(round(bosses.size() * 6.0 + flags.size() * 0.5)), 0, 100)

func embers() -> int:
	var n := 0
	for i in range(1, 7):
		if flags.get("ember_%d" % i, false): n += 1
	return n

func _process(delta: float) -> void:
	if get_tree().paused:
		return
	if get_tree().current_scene and get_tree().current_scene.get("world") != null:
		play_time += delta
		for b in buffs.keys():
			buffs[b] -= delta
			if buffs[b] <= 0:
				buffs.erase(b)

## migração: a gravação antiga (uma só) passa para a memória 1
func _ready() -> void:
	if FileAccess.file_exists("user://save.json") and not FileAccess.file_exists(slot_path(0)):
		DirAccess.rename_absolute(ProjectSettings.globalize_path("user://save.json"), ProjectSettings.globalize_path(slot_path(0)))

func new_game(i := -1) -> void:
	if i >= 0:
		slot = i
	play_time = 0.0; deaths = 0
	max_hp = 100; hp = 100; flasks = 3; max_flasks = 3; ash = 0; lume = 0.0
	bosses = {}; flags = {}; abilities = {"dash": false, "double": false}
	room = "r1_wake"; spawn = Vector2(-1, -1); altar_room = ""
	items = {}; weapons = ["desperto"]; weapon_id = "desperto"; relics = []; equipped = []; relic_slots = 2

# ------------------------------------------------------------------ itens (state.give/take do jogo web)
func count(id: String) -> int:
	return int(items.get(id, 0))

func has(id: String) -> bool:
	return count(id) > 0 or relics.has(id)

func give(id: String, n := 1) -> void:
	var it: Dictionary = Data.items.get(id, {})
	if it.is_empty():
		push_warning("item desconhecido: " + id); return
	match String(it.get("cat", "")):
		"weapon":
			if not weapons.has(String(it["weapon"])): weapons.append(String(it["weapon"]))
			return
		"relic":
			if not relics.has(id): relics.append(id)
			if equipped.size() < relic_slots and not equipped.has(id): equipped.append(id)
			return
	match id:
		"candle_fragment":
			max_flasks += n; flasks = max_flasks; return
		"ash_heart":
			max_hp += 15 * n; hp = max_hp; return
		"relic_slot":
			relic_slots = mini(5, relic_slots + n); return
	items[id] = mini(int(it.get("max", 99)), count(id) + n)

func take(id: String, n := 1) -> void:
	items[id] = maxi(0, count(id) - n)
	if int(items[id]) == 0:
		items.erase(id)

func equip(id: String) -> bool:
	if not relics.has(id) or equipped.has(id) or equipped.size() >= relic_slots:
		return false
	equipped.append(id); return true

func unequip(id: String) -> void:
	equipped.erase(id)

func has_save() -> bool:
	return last_slot() >= 0

func save() -> void:
	# grava primeiro num ficheiro temporário e só depois troca: uma queda a meio não estraga a memória
	var tmp := slot_path(slot) + ".tmp"
	var f := FileAccess.open(tmp, FileAccess.WRITE)
	if f == null:
		return
	f.store_string(JSON.stringify({
		"v": 2, "max_hp": max_hp, "flasks": max_flasks, "ash": ash, "bosses": bosses, "flags": flags,
		"abilities": abilities, "room": altar_room if altar_room != "" else room, "altar": altar_room,
		"items": items, "weapons": weapons, "weapon_id": weapon_id, "relics": relics, "equipped": equipped, "relic_slots": relic_slots,
		"play_time": play_time, "deaths": deaths, "saved_at": int(Time.get_unix_time_from_system()),
	}))
	f.close()
	DirAccess.rename_absolute(ProjectSettings.globalize_path(tmp), ProjectSettings.globalize_path(slot_path(slot)))

func load_game(i := -1) -> bool:
	if i < 0:
		i = last_slot()
	if i < 0:
		return false
	var d := slot_meta(i)
	if d.is_empty():
		return false
	new_game(i)
	play_time = float(d.get("play_time", 0.0)); deaths = int(d.get("deaths", 0))
	max_hp = int(d.get("max_hp", 100)); hp = max_hp
	max_flasks = int(d.get("flasks", 3)); flasks = max_flasks
	ash = int(d.get("ash", 0))
	bosses = d.get("bosses", {}); flags = d.get("flags", {}); abilities = d.get("abilities", abilities)
	room = String(d.get("room", "r1_wake")); altar_room = String(d.get("altar", ""))
	items = d.get("items", {}); relics = d.get("relics", []); equipped = d.get("equipped", [])
	weapons = d.get("weapons", ["desperto"]); weapon_id = String(d.get("weapon_id", "desperto"))
	relic_slots = int(d.get("relic_slots", 2))
	for k in items.keys():
		items[k] = int(items[k])
	return true
