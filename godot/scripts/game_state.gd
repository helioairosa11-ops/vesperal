extends Node
## Estado da partida (vida, cinza, chefes vencidos, altar) e gravação em user://save.json

var max_hp := 100
var hp := 100
var flasks := 3
var max_flasks := 3
var ash := 0
var bosses: Dictionary = {}
var flags: Dictionary = {}
var abilities: Dictionary = {"dash": false, "double": false}
var room := "r1_wake"
var spawn := Vector2(-1, -1)
var altar_room := ""

const SAVE := "user://save.json"

func new_game() -> void:
	max_hp = 100; hp = 100; flasks = 3; max_flasks = 3; ash = 0
	bosses = {}; flags = {}; abilities = {"dash": false, "double": false}
	room = "r1_wake"; spawn = Vector2(-1, -1); altar_room = ""

func has_save() -> bool:
	return FileAccess.file_exists(SAVE)

func save() -> void:
	var f := FileAccess.open(SAVE, FileAccess.WRITE)
	if f == null:
		return
	f.store_string(JSON.stringify({
		"max_hp": max_hp, "flasks": max_flasks, "ash": ash, "bosses": bosses, "flags": flags,
		"abilities": abilities, "room": altar_room if altar_room != "" else room, "altar": altar_room,
	}))

func load_game() -> bool:
	if not has_save():
		return false
	var d = JSON.parse_string(FileAccess.get_file_as_string(SAVE))
	if typeof(d) != TYPE_DICTIONARY:
		return false
	new_game()
	max_hp = int(d.get("max_hp", 100)); hp = max_hp
	max_flasks = int(d.get("flasks", 3)); flasks = max_flasks
	ash = int(d.get("ash", 0))
	bosses = d.get("bosses", {}); flags = d.get("flags", {}); abilities = d.get("abilities", abilities)
	room = String(d.get("room", "r1_wake")); altar_room = String(d.get("altar", ""))
	return true
