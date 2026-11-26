extends Node
## Áudio igual ao do jogo web: efeitos, músicas e ambientes foram gravados do próprio motor web
## (tools/render_audio_godot.py) e tocam aqui com os mesmos nomes.

var players: Array = []
var music_a: AudioStreamPlayer
var music_b: AudioStreamPlayer
var amb: AudioStreamPlayer
var music_id := ""
var amb_id := ""
var last: Dictionary = {}
var cache: Dictionary = {}
var intensity := 0

func _ready() -> void:
	for i in 24:
		var p := AudioStreamPlayer.new()
		p.bus = "SFX"
		add_child(p)
		players.append(p)
	music_a = AudioStreamPlayer.new(); music_a.bus = "Music"; add_child(music_a)
	music_b = AudioStreamPlayer.new(); music_b.bus = "Music"; add_child(music_b)
	amb = AudioStreamPlayer.new(); amb.bus = "Amb"; add_child(amb)
	process_mode = Node.PROCESS_MODE_ALWAYS

func _stream(path: String, loop := false) -> AudioStream:
	if cache.has(path):
		return cache[path]
	if not ResourceLoader.exists(path):
		cache[path] = null
		return null
	var s: AudioStreamOggVorbis = load(path)
	if s and loop:
		s = s.duplicate()
		s.loop = true
	cache[path] = s
	return s

## sons de impacto gravados (tools/build_impacts.py): várias versões e um pouco de variação de tom
const IMPACTS := ["hit", "hit_heavy", "hit_metal", "hit_stone", "hit_wood", "hit_soft", "enemy_hurt", "boss_hit",
	"hit_blunt", "hurt", "block", "shield", "parry", "crush"]
var variants: Dictionary = {}
var last_variant: Dictionary = {}

func _variant_count(nm: String) -> int:
	if not variants.has(nm):
		var n := 1
		while n < 8 and ResourceLoader.exists("res://audio/sfx/%s_%d.ogg" % [nm, n + 1]):
			n += 1
		variants[nm] = n
	return variants[nm]

## efeito com o nome do jogo web (swing, jump, parry, enemy_hurt, ...)
func sfx(nm: String, vol := 1.0) -> void:
	var now := Time.get_ticks_msec() / 1000.0
	if last.has(nm) and now - last[nm] < 0.03:
		return
	last[nm] = now
	# escolhe uma versão diferente da última
	var n := _variant_count(nm)
	var k := 0
	if n > 1:
		k = randi() % n
		if k == int(last_variant.get(nm, -1)):
			k = (k + 1) % n
		last_variant[nm] = k
	var s := _stream("res://audio/sfx/%s.ogg" % nm if k == 0 else "res://audio/sfx/%s_%d.ogg" % [nm, k + 1])
	if s == null:
		return
	# canal livre; se estão todos ocupados, reaproveita o que já tocou há mais tempo (o golpe novo nunca se perde)
	var pick: AudioStreamPlayer = null
	var oldest := -1.0
	for p in players:
		if not p.playing:
			pick = p
			break
		var pos: float = p.get_playback_position()
		if pos > oldest:
			oldest = pos; pick = p
	pick.stream = s
	pick.volume_db = linear_to_db(maxf(0.001, vol))
	pick.pitch_scale = randf_range(0.93, 1.07) if IMPACTS.has(nm) else 1.0
	pick.play()

## música por id (r1, sanct, menu, sb_coveiro, ...), com troca suave
func play_music(id: String, fade := 1.5) -> void:
	if id == music_id:
		return
	music_id = id
	var s: AudioStream = null
	if id != "":
		var path := "res://audio/music/%s.ogg" % id
		path = _music_path(id, intensity)
		s = _stream(path, true)
	var old := music_a
	music_a = music_b; music_b = old
	if old.playing:
		var tw := create_tween()
		tw.tween_property(old, "volume_db", -60.0, fade)
		tw.tween_callback(old.stop)
	if s:
		music_a.stream = s
		music_a.volume_db = -60.0
		music_a.play()
		create_tween().tween_property(music_a, "volume_db", 0.0, fade)

func set_intensity(n: int) -> void:
	if n == intensity:
		return
	var id := music_id
	var before := _music_path(id, intensity)
	intensity = n
	# faixas sem versão mais intensa (ficheiros licenciados) continuam sem recomeçar
	if _music_path(id, n) == before:
		return
	music_id = ""
	play_music(id, 1.0)

## faixas licenciadas (um só ficheiro, sem versões mais intensas)
const LICENSED := ["sb_coveiro", "sb_matilheira", "b_caedmon", "sb_automato", "b_hilde", "sb_mariposa", "b_elowen", "sb_sineiro", "sb_vael", "b_ozias", "sb_gemeos", "b_aldric", "b_seraphine", "b_carpideira", "b_custodio"]

func _music_path(id: String, lvl: int) -> String:
	if lvl > 0 and not LICENSED.has(id) and ResourceLoader.exists("res://audio/music/%s_i%d.ogg" % [id, lvl]):
		return "res://audio/music/%s_i%d.ogg" % [id, lvl]
	return "res://audio/music/%s.ogg" % id

func stop_music(fade := 1.2) -> void:
	play_music("", fade)

func set_ambience(id: String) -> void:
	if id == amb_id:
		return
	amb_id = id
	var s := _stream("res://audio/amb/%s.ogg" % id, true) if id != "" else null
	if s == null:
		create_tween().tween_property(amb, "volume_db", -60.0, 1.5)
		return
	amb.stream = s
	amb.volume_db = -60.0
	amb.play()
	create_tween().tween_property(amb, "volume_db", 0.0, 2.0)
