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
	for i in 16:
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

## efeito com o nome do jogo web (swing, jump, parry, enemy_hurt, ...)
func sfx(nm: String, vol := 1.0) -> void:
	var now := Time.get_ticks_msec() / 1000.0
	if last.has(nm) and now - last[nm] < 0.03:
		return
	last[nm] = now
	var s := _stream("res://audio/sfx/%s.ogg" % nm)
	if s == null:
		return
	for p in players:
		if not p.playing:
			p.stream = s
			p.volume_db = linear_to_db(maxf(0.001, vol))
			p.play()
			return

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
const LICENSED := ["sb_coveiro", "b_caedmon", "b_hilde"]

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
