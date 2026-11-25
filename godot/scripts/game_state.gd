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
	return true
