extends Node
## Arranque: teclas, menu principal (arte do jogo web) e o mundo.

const KEYS := {
	"left": [KEY_A, KEY_LEFT], "right": [KEY_D, KEY_RIGHT], "up": [KEY_W, KEY_UP], "down": [KEY_S, KEY_DOWN],
	"jump": [KEY_SPACE, KEY_Z], "attack": [KEY_J, KEY_X], "dodge": [KEY_L, KEY_SHIFT, KEY_C],
	"parry": [KEY_I, KEY_B], "heal": [KEY_F], "interact": [KEY_E], "pause": [KEY_ESCAPE],
}
const PADS := {
	"jump": [JOY_BUTTON_A], "attack": [JOY_BUTTON_X], "dodge": [JOY_BUTTON_B], "parry": [JOY_BUTTON_LEFT_SHOULDER],
	"heal": [JOY_BUTTON_Y], "interact": [JOY_BUTTON_DPAD_UP], "pause": [JOY_BUTTON_START],
	"left": [JOY_BUTTON_DPAD_LEFT], "right": [JOY_BUTTON_DPAD_RIGHT], "down": [JOY_BUTTON_DPAD_DOWN],
}

var world
var menu: Control

func _ready() -> void:
	_setup_input()
	if OS.get_cmdline_user_args().has("--autotest"):
		GameState.new_game(); _start_world()
		var at = load("res://scripts/autotest.gd").new()
		at.main = self
		add_child(at)
		return
	_show_menu()
	if OS.get_cmdline_user_args().has("--menushot"):
		var d := OS.get_environment("SHOTS")
		await get_tree().create_timer(1.5).timeout
		get_viewport().get_texture().get_image().save_png(d + "/menu.png")
		Input.action_press("ui_down"); await get_tree().process_frame; Input.action_release("ui_down")
		var ev := InputEventAction.new(); ev.action = "ui_down"; ev.pressed = true; Input.parse_input_event(ev)
		await get_tree().create_timer(0.6).timeout
		get_viewport().get_texture().get_image().save_png(d + "/menu2.png")
		get_tree().quit()

func _unhandled_key_input(e: InputEvent) -> void:
	if e is InputEventKey and e.pressed and not e.echo and e.physical_keycode == KEY_F11:
		var fs := DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED if fs else DisplayServer.WINDOW_MODE_FULLSCREEN)

func _setup_input() -> void:
	for a in KEYS:
		if not InputMap.has_action(a):
			InputMap.add_action(a, 0.3)
		for k in KEYS[a]:
			var e := InputEventKey.new(); e.physical_keycode = k
			InputMap.action_add_event(a, e)
		for b in PADS.get(a, []):
			var j := InputEventJoypadButton.new(); j.button_index = b
			InputMap.action_add_event(a, j)
	for pair in [["left", JOY_AXIS_LEFT_X, -1.0], ["right", JOY_AXIS_LEFT_X, 1.0], ["up", JOY_AXIS_LEFT_Y, -1.0], ["down", JOY_AXIS_LEFT_Y, 1.0]]:
		var m := InputEventJoypadMotion.new(); m.axis = pair[1]; m.axis_value = pair[2]
		InputMap.action_add_event(pair[0], m)

func _show_menu() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	menu = load("res://scripts/menu.gd").new()
	layer.add_child(menu)
	menu.continue_game.connect(func(): GameState.load_game(); _start_world())
	menu.start_new.connect(func(): GameState.new_game(); _start_world())

func _start_world() -> void:
	if menu:
		menu.get_parent().queue_free(); menu = null
	Audio.set_ambience("")
	world = preload("res://scripts/world.gd").new()
	add_child(world)
	world.start(GameState.room)
