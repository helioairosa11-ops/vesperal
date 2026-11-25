extends Node
## Dados convertidos do jogo web (tools/export_godot_data.py): salas, folhas de sprites, regiões, textos, adereços.

const TILE := 20
const CELL_W := 32
const CELL_H := 18

var rooms: Dictionary = {}
var sprites: Dictionary = {}
var regions: Dictionary = {}
var props: Dictionary = {}
var lang: Dictionary = {}
var cell_index: Dictionary = {}
var _tex: Dictionary = {}

func _ready() -> void:
	rooms = _json("res://data/rooms.json")
	sprites = _json("res://data/sprites.json")
	regions = _json("res://data/regions.json")
	props = _json("res://data/props.json")
	lang = _json("res://data/lang_pt.json")
	for id in rooms:
		var d: Dictionary = rooms[id]
		d["id"] = id
		var h: int = d["map"].size()
		var w := 0
		for row in d["map"]:
			w = max(w, String(row).length())
		d["cw"] = int(round(float(w) / CELL_W))
		d["ch"] = int(round(float(h) / CELL_H))
		for i in d["cw"]:
			for j in d["ch"]:
				cell_index[Vector2i(int(d["x"]) + i, int(d["y"]) + j)] = id

func _json(path: String) -> Variant:
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		push_error("sem dados: " + path)
		return {}
	return JSON.parse_string(f.get_as_text())

func t(key: String) -> String:
	return String(lang.get(key, key))

func room_at_cell(c: Vector2i) -> String:
	return cell_index.get(c, "")

func region(key: String) -> Dictionary:
	return regions.get(key, regions.get("r1", {}))

func tex(path: String) -> Texture2D:
	if not _tex.has(path):
		_tex[path] = load(path)
	return _tex[path]

## folha de sprites: textura + meta
func sheet(name: String) -> Dictionary:
	if not sprites.has(name):
		return {}
	var path := "res://art/sprites/%s.png" % name
	if not ResourceLoader.exists(path):
		return {}
	return {"tex": tex(path), "meta": sprites[name]}

func has_anim(sh: Dictionary, anim: String) -> bool:
	return not sh.is_empty() and sh["meta"]["anims"].has(anim)

## quadro pela posição k (em quadros) dentro da animação
func frame(sh: Dictionary, anim: String, k: float) -> Dictionary:
	var a: Dictionary = sh["meta"]["anims"].get(anim, sh["meta"]["anims"].get("idle", {}))
	if a.is_empty():
		return {}
	var fr: Array = a["frames"]
	var n := fr.size()
	var i := int(floor(k))
	if a.get("loop", false):
		i = posmod(i, n)
	else:
		i = clampi(i, 0, n - 1)
	return sh["meta"]["frames"][int(fr[i])]

## quadro pela fase de um ataque (wind/act/rec) e o progresso 0..1 dentro dela
func phase_frame(sh: Dictionary, anim: String, phase: String, k: float) -> Dictionary:
	var a: Dictionary = sh["meta"]["anims"].get(anim, {})
	if a.is_empty():
		return frame(sh, "idle", 0)
	var ph = a.get("phases")
	if ph == null or not ph.has(phase):
		return frame(sh, anim, clampf(k, 0, 0.999) * a["frames"].size())
	var i0: int = int(ph[phase][0])
	var i1: int = int(ph[phase][1])
	var i := mini(i1 - 1, i0 + int(floor(clampf(k, 0.0, 0.999) * (i1 - i0))))
	return sh["meta"]["frames"][int(a["frames"][i])]

func anim_len(sh: Dictionary, anim: String) -> float:
	var a: Dictionary = sh["meta"]["anims"].get(anim, {})
	if a.is_empty():
		return 0.0
	return a["frames"].size() / float(a["fps"])

## desenha um quadro com a âncora em (0,0) (pés ao centro); o chamador põe a transformação
func draw_frame(ci: CanvasItem, sh: Dictionary, f: Dictionary, mod := Color.WHITE) -> void:
	if f.is_empty():
		return
	var s: float = f.get("s", sh["meta"]["scale"])
	var src := Rect2(f["x"], f["y"], f["w"], f["h"])
	var dst := Rect2(f["ox"], f["oy"], f["w"] / s, f["h"] / s)
	ci.draw_texture_rect_region(sh["tex"], dst, src, mod)

func frame_rect(sh: Dictionary, f: Dictionary) -> Rect2:
	var s: float = f.get("s", sh["meta"]["scale"])
	return Rect2(f["ox"], f["oy"], f["w"] / s, f["h"] / s)

## ponto nomeado do quadro (ponta da arma, olhos, ...), relativo à âncora
func point(f: Dictionary, key: String) -> Variant:
	var p = f.get("pts", {}).get(key)
	if p == null:
		return null
	return Vector2(p[0], p[1])

func color(hex: String, fallback := Color.GRAY) -> Color:
	if hex == null or hex == "":
		return fallback
	if hex.begins_with("rgba"):
		var nums := hex.substr(5, hex.length() - 6).split(",")
		return Color(float(nums[0]) / 255.0, float(nums[1]) / 255.0, float(nums[2]) / 255.0, float(nums[3]))
	return Color.html(hex)
