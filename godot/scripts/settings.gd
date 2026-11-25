extends Node
## Definições do jogo (as do jogo web + as de PC): idioma, câmara, texto, vídeo, áudio, teclas, acessibilidade.
## Gravadas em user://settings.json e aplicadas logo (janela, V-Sync, FPS, volumes, teclas, idioma).

const PATH := "user://settings.json"
const LANGS := ["pt", "en", "es", "fr"]
const LANG_NAMES := {"pt": "Português", "en": "English", "es": "Español", "fr": "Français"}
const RESOLUTIONS := [Vector2i(1280, 720), Vector2i(1366, 768), Vector2i(1600, 900), Vector2i(1920, 1080), Vector2i(2560, 1440), Vector2i(3840, 2160)]
## ações que se podem redefinir (como In.REMAPPABLE no jogo web)
const REMAPPABLE := ["left", "right", "up", "down", "jump", "attack", "dodge", "parry", "heal", "interact", "pause"]
const DEFAULT_KEYS := {
	"left": [KEY_A, KEY_LEFT], "right": [KEY_D, KEY_RIGHT], "up": [KEY_W, KEY_UP], "down": [KEY_S, KEY_DOWN],
	"jump": [KEY_SPACE, KEY_Z], "attack": [KEY_J, KEY_X], "dodge": [KEY_L, KEY_SHIFT, KEY_C],
	"parry": [KEY_I, KEY_B], "heal": [KEY_F], "interact": [KEY_E], "pause": [KEY_ESCAPE],
}
const PADS := {
	"jump": [JOY_BUTTON_A], "attack": [JOY_BUTTON_X], "dodge": [JOY_BUTTON_B], "parry": [JOY_BUTTON_RIGHT_SHOULDER],
	"heal": [JOY_BUTTON_LEFT_SHOULDER], "interact": [JOY_BUTTON_Y], "pause": [JOY_BUTTON_START],
	"left": [JOY_BUTTON_DPAD_LEFT], "right": [JOY_BUTTON_DPAD_RIGHT], "up": [JOY_BUTTON_DPAD_UP], "down": [JOY_BUTTON_DPAD_DOWN],
}

var s: Dictionary = {}

func defaults() -> Dictionary:
	return {
		"lang": _detect_lang(), "zoom": 1.4, "text_speed": 1.0, "show_timer": false,
		"window": "fullscreen", "resolution": [1920, 1080], "vsync": true, "fps_cap": 0, "show_fps": false, "particles": true, "brightness": 1.0,
		"vol": {"master": 0.8, "music": 0.7, "sfx": 0.8, "amb": 0.6}, "mute": {"music": false, "sfx": false, "amb": false},
		"keys": {}, "shake": 1.0, "flashes": true, "telegraphs": true, "vibration": true,
	}

func _detect_lang() -> String:
	var l := OS.get_locale_language()
	return l if l in LANGS else "en"

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	s = defaults()
	if FileAccess.file_exists(PATH):
		var d = JSON.parse_string(FileAccess.get_file_as_string(PATH))
		if typeof(d) == TYPE_DICTIONARY:
			for k in d:
				if s.has(k) and typeof(s[k]) == TYPE_DICTIONARY and typeof(d[k]) == TYPE_DICTIONARY:
					s[k].merge(d[k], true)
				elif s.has(k):
					s[k] = d[k]
	apply()

func get_v(k: String):
	return s.get(k)

func set_v(k: String, v) -> void:
	s[k] = v
	apply(); save()

func save() -> void:
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(s, "\t"))

func apply() -> void:
	Data.set_lang(String(s["lang"]))
	# janela
	var mode := String(s["window"])
	match mode:
		"fullscreen": DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
		"borderless":
			DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
			DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_BORDERLESS, true)
			var scr := DisplayServer.window_get_current_screen()
			DisplayServer.window_set_size(DisplayServer.screen_get_size(scr))
			DisplayServer.window_set_position(DisplayServer.screen_get_position(scr))
		_:
			if DisplayServer.window_get_mode() != DisplayServer.WINDOW_MODE_WINDOWED:
				DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
			DisplayServer.window_set_flag(DisplayServer.WINDOW_FLAG_BORDERLESS, false)
			var r: Array = s["resolution"]
			var scr2 := DisplayServer.window_get_current_screen()
			var ss := DisplayServer.screen_get_size(scr2)
			var sz := Vector2i(mini(int(r[0]), ss.x), mini(int(r[1]), ss.y))
			DisplayServer.window_set_size(sz)
			DisplayServer.window_set_position(DisplayServer.screen_get_position(scr2) + Vector2i((ss - sz) / 2.0))
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if s["vsync"] else DisplayServer.VSYNC_DISABLED)
	Engine.max_fps = int(s["fps_cap"])
	# áudio: barramentos Music, SFX, Amb debaixo do Master
	_bus("Master", float(s["vol"]["master"]), false)
	_bus("Music", float(s["vol"]["music"]), bool(s["mute"]["music"]))
	_bus("SFX", float(s["vol"]["sfx"]), bool(s["mute"]["sfx"]))
	_bus("Amb", float(s["vol"]["amb"]), bool(s["mute"]["amb"]))
	apply_keys()
	_apply_brightness()

var _bright_rect: ColorRect
func _apply_brightness() -> void:
	var b := float(s.get("brightness", 1.0))
	if _bright_rect == null:
		var layer := CanvasLayer.new(); layer.layer = 25
		add_child(layer)
		_bright_rect = ColorRect.new()
		_bright_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
		_bright_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var sh := Shader.new()
		sh.code = "shader_type canvas_item;\nuniform float b = 1.0;\nuniform sampler2D scr : hint_screen_texture, filter_linear;\nvoid fragment() { vec3 c = texture(scr, SCREEN_UV).rgb; COLOR = vec4(b > 1.0 ? 1.0 - (1.0 - c) * (2.0 - b) : c * b, 1.0); }"
		var m := ShaderMaterial.new(); m.shader = sh
		_bright_rect.material = m
		layer.add_child(_bright_rect)
	(_bright_rect.material as ShaderMaterial).set_shader_parameter("b", b)
	_bright_rect.visible = absf(b - 1.0) > 0.01

func _bus(nm: String, v: float, mute: bool) -> void:
	var i := AudioServer.get_bus_index(nm)
	if i < 0:
		AudioServer.add_bus()
		i = AudioServer.bus_count - 1
		AudioServer.set_bus_name(i, nm)
		AudioServer.set_bus_send(i, "Master")
	# os sons foram gravados com o volume por omissão do jogo web: 1,0 aqui = o volume por omissão de lá
	var base: float = {"Master": 0.8, "Music": 0.7, "SFX": 0.8, "Amb": 0.6}[nm]
	AudioServer.set_bus_volume_db(i, linear_to_db(maxf(0.0001, v / base)))
	AudioServer.set_bus_mute(i, mute or v <= 0.001)

# ------------------------------------------------------------------ teclas e comando
func keys_for(a: String) -> Array:
	var k: Dictionary = s["keys"]
	return k[a] if k.has(a) else DEFAULT_KEYS.get(a, [])

func apply_keys() -> void:
	for a in REMAPPABLE:
		if not InputMap.has_action(a):
			InputMap.add_action(a, 0.3)
		InputMap.action_erase_events(a)
		for code in keys_for(a):
			var e := InputEventKey.new(); e.physical_keycode = int(code) as Key
			InputMap.action_add_event(a, e)
		for b in PADS.get(a, []):
			var j := InputEventJoypadButton.new(); j.button_index = b as JoyButton
			InputMap.action_add_event(a, j)
	for pair in [["left", JOY_AXIS_LEFT_X, -1.0], ["right", JOY_AXIS_LEFT_X, 1.0], ["up", JOY_AXIS_LEFT_Y, -1.0], ["down", JOY_AXIS_LEFT_Y, 1.0]]:
		var m := InputEventJoypadMotion.new(); m.axis = pair[1]; m.axis_value = pair[2]
		InputMap.action_add_event(pair[0], m)
	# os menus do Godot também respondem às teclas do jogo e ao comando
	for pair2 in [["ui_up", "up"], ["ui_down", "down"], ["ui_left", "left"], ["ui_right", "right"]]:
		for ev in InputMap.action_get_events(pair2[1]):
			if not InputMap.action_has_event(pair2[0], ev):
				InputMap.action_add_event(pair2[0], ev)

func rebind(a: String, code: int) -> void:
	var cur: Array = keys_for(a).duplicate()
	# tira a tecla de outras ações para não haver conflitos
	var k: Dictionary = s["keys"]
	for other in REMAPPABLE:
		if other == a:
			continue
		var lst: Array = keys_for(other).duplicate()
		if lst.has(code):
			lst.erase(code); k[other] = lst
	if cur.is_empty():
		cur = [code]
	else:
		cur[0] = code
	k[a] = cur
	s["keys"] = k
	apply_keys(); save()

func reset_keys() -> void:
	s["keys"] = {}
	apply_keys(); save()

func key_label(code: int) -> String:
	return OS.get_keycode_string(code)
