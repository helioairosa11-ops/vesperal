extends Node
## Arranque: teclas, menu principal (arte do jogo web) e o mundo.

var world
var menu: Control

func _ready() -> void:
	Settings.apply_keys()
	Data.warm_up()
	if OS.get_cmdline_user_args().has("--autotest"):
		GameState.new_game(); _start_world()
		var at = load("res://scripts/autotest.gd").new()
		at.main = self
		add_child(at)
		return
	_show_menu()
	if OS.get_cmdline_user_args().has("--uishot"):
		var d2 := OS.get_environment("SHOTS")
		await get_tree().create_timer(1.0).timeout
		var shot := func(n: String): get_viewport().get_texture().get_image().save_png(d2 + "/" + n + ".png")
		UI.open_settings(); await get_tree().create_timer(0.4).timeout; shot.call("u1_general")
		for k in 1:
			UI._tab(1)
		await get_tree().create_timer(0.3).timeout; shot.call("u2_video")
		UI._tab(1); await get_tree().create_timer(0.3).timeout; shot.call("u3_audio")
		UI._tab(1); await get_tree().create_timer(0.3).timeout; shot.call("u4_controls")
		UI._tab(-3); UI._adjust(1); await get_tree().create_timer(0.4).timeout; shot.call("u5_lang_en")
		UI._adjust(-1)
		UI.close_all(); UI.open_slots(func(_i, _f): pass); await get_tree().create_timer(0.4).timeout; shot.call("u6_slots")
		UI.close_all(); UI.open_credits(); await get_tree().create_timer(0.4).timeout; shot.call("u7_credits")
		UI.close_all()
		get_tree().quit()
		return
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
		Settings.set_v("window", "windowed" if String(Settings.get_v("window")) == "fullscreen" else "fullscreen")

func _show_menu() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	menu = load("res://scripts/menu.gd").new()
	layer.add_child(menu)
	menu.continue_game.connect(func(): if GameState.load_game(): _start_world())
	menu.start_new.connect(func(i: int, fresh: bool):
		if fresh or not GameState.load_game(i):
			GameState.new_game(i); GameState.save()
		_start_world())

func _start_world() -> void:
	if menu:
		menu.get_parent().queue_free(); menu = null
	Audio.set_ambience("")
	world = preload("res://scripts/world.gd").new()
	add_child(world)
	world.quit_to_menu.connect(_back_to_menu)
	world.start(GameState.room)

func _back_to_menu() -> void:
	if world:
		world.queue_free(); world = null
	get_tree().paused = false
	_show_menu()
