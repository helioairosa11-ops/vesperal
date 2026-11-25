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
	menu = Control.new()
	menu.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(menu)
	var bg := TextureRect.new()
	bg.texture = load("res://art/bg/menu.jpg")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	menu.add_child(bg)
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_CENTER)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 18)
	box.position = Vector2(-260, -330)
	box.custom_minimum_size = Vector2(520, 660)
	menu.add_child(box)
	var logo := TextureRect.new()
	logo.texture = load("res://art/ui/logo_v.png")
	logo.custom_minimum_size = Vector2(260, 263)
	logo.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	logo.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	box.add_child(logo)
	var title := Label.new()
	title.text = "VESPERAL"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_override("font", load("res://art/fonts/Cinzel-Bold.woff2"))
	title.add_theme_font_size_override("font_size", 64)
	title.add_theme_color_override("font_color", Color("#e8d0a8"))
	title.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	box.add_child(title)
	var sub := Label.new()
	sub.text = "A Última Chama"
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sub.add_theme_font_override("font", load("res://art/fonts/EBGaramond-Regular.woff2"))
	sub.add_theme_font_size_override("font_size", 30)
	sub.add_theme_color_override("font_color", Color("#c8a880"))
	box.add_child(sub)
	var first: Button = null
	if GameState.has_save():
		first = _button(box, "Continuar", func(): GameState.load_game(); _start_world())
	var nb := _button(box, "Novo Jogo", func(): GameState.new_game(); _start_world())
	if first == null:
		first = nb
	_button(box, "Sair", func(): get_tree().quit())
	first.grab_focus.call_deferred()

func _button(parent: Control, text: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(340, 56)
	b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	var f := load("res://art/fonts/Cinzel-Bold.woff2")
	b.add_theme_font_override("font", f)
	b.add_theme_font_size_override("font_size", 26)
	for st in ["normal", "hover", "pressed", "focus"]:
		var sb := StyleBoxTexture.new()
		sb.texture = load("res://art/ui/btn_focus.png" if st in ["hover", "focus"] else "res://art/ui/btn.png")
		b.add_theme_stylebox_override(st, sb)
	b.add_theme_color_override("font_color", Color("#d8c4a4"))
	b.add_theme_color_override("font_hover_color", Color("#fff0d0"))
	b.add_theme_color_override("font_focus_color", Color("#fff0d0"))
	b.pressed.connect(cb)
	parent.add_child(b)
	return b

func _start_world() -> void:
	if menu:
		menu.queue_free(); menu = null
	world = preload("res://scripts/world.gd").new()
	add_child(world)
	world.start(GameState.room)
