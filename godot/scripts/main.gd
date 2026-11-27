extends Node
## Arranque: teclas, menu principal (arte do jogo web) e o mundo.

var world
var menu: Control

func _ready() -> void:
	Settings.apply_keys()
	Data.warm_up()
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--lang="):
			Settings.set_v("lang", a.substr(7))
	if OS.get_cmdline_user_args().has("--autotest"):
		GameState.new_game(); _start_world()
		var at = load("res://scripts/autotest.gd").new()
		at.process_mode = Node.PROCESS_MODE_ALWAYS   # continua com o jogo em pausa (menus)
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
		UI.close_all(); UI.confirm(Data.t("confirm_quit"), func(): pass); await get_tree().create_timer(0.4).timeout; shot.call("u8_confirm")
		UI.close_all()
		# dentro do jogo: pausa, inventário, leitura, diálogo, item obtido, aviso
		GameState.new_game(0)
		for id in ["salt", "salt", "ash_steel", "letter_3", "lost_bell", "r_lantern", "w_espirito", "candle_fragment"]:
			GameState.give(id)
		GameState.abilities["dash"] = true
		_start_world()
		await get_tree().create_timer(1.5).timeout
		UI.open_pause(world); await get_tree().create_timer(0.4).timeout; shot.call("g1_pause")
		UI.close_all(); UI.open_inventory(world); await get_tree().create_timer(0.4).timeout; shot.call("g2_inv_weapons")
		UI._tab(1); await get_tree().create_timer(0.3).timeout; shot.call("g3_inv_relics")
		UI._tab(1); await get_tree().create_timer(0.3).timeout; shot.call("g4_inv_cons")
		UI._tab(1); UI._adjust(1); await get_tree().create_timer(0.3).timeout; shot.call("g5_inv_key")
		UI.close_all(); world.hud.read(Data.t("item_letter_3_name"), Data.t("letter_3_text"), true); await get_tree().create_timer(0.4).timeout; shot.call("g6_letter")
		UI.close_all(); get_tree().paused = false
		world.hud.dialogue([{"s": "npc_ione", "k": "ione_meet1"}], [], Callable())
		await get_tree().create_timer(2.5).timeout; shot.call("g7_dialogue")
		world.hud.dlg = {}
		world.hud.dialogue([{"s": "", "k": "ione_meet1"}], ["yes", "no"], Callable())
		await get_tree().create_timer(3.5).timeout; shot.call("g8_narration_choices")
		world.hud.dlg = {}
		world.hud.item_get("r_lantern"); world.hud.toast(Data.t("tut_dash"))
		for it in world.interactables:
			if it["t"] in ["altar", "inscription", "npc"]:
				world.player.position.x += it["p"].x - world.player.cx + 6; world.player.prev_pos = world.player.position
				break
		await get_tree().create_timer(0.6).timeout; shot.call("g9_notes")
		get_tree().quit()
		return
	if OS.get_cmdline_user_args().has("--clicktest"):
		await get_tree().create_timer(1.0).timeout
		UI.open_settings(); await get_tree().create_timer(0.5).timeout
		var r: Rect2 = UI._close_r
		var ev := InputEventMouseButton.new(); ev.button_index = MOUSE_BUTTON_LEFT; ev.pressed = true; var wp := r.get_center() * (Vector2(DisplayServer.window_get_size()) / get_viewport().get_visible_rect().size); ev.position = wp; ev.global_position = wp
		Input.parse_input_event(ev)
		await get_tree().create_timer(0.3).timeout
		print("CLICKTEST open_after_click=", UI.is_open(), " close_rect=", r, " csize=", UI.c.size)
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
