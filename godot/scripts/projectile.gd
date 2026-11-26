extends Actor
## Projétil (inimigo): torrões, cera a arder... desenhado com a folha fx_proj do jogo web.

var dmg := 10.0
var life := 3.0
var kind := "orb"
var fire := false
var grav := 0.0
var aid := 0
var spin := 0.0
var sh: Dictionary
var light: PointLight2D
var color := Color("#ffb060")
var trail := false
var parryable := true
var solid := true
var on_wall := ""   # "fire": deixa uma poça de fogo onde bate (o metal fundido do Fundidor)
# igual a PROJ em js/render/enemy_render.js: [animação, modo, tamanho nominal]
const PROJ := {
	"bolt": ["bolt", "dir", 12], "orb": ["orb", "", 9], "spark": ["spark", "dir", 12], "molten": ["molten", "spin", 10], "ingot": ["ingot", "spin", 10],
	"clod": ["clod", "spin", 10], "note": ["note", "", 9], "light": ["light", "", 10], "holy": ["light", "", 10], "seed": ["seed", "spin", 8],
	"thorn": ["thorn", "dir", 10], "moth": ["moth", "flip", 8], "feather": ["feather", "dir", 12], "wave": ["wave", "flip", 22], "fire": ["fire", "", 16],
	"incense": ["incense", "", 12], "spiritwave": ["spiritwave", "flip", 18], "orbFire": ["orb", "", 9],
}

func setup(o: Dictionary) -> void:
	size = o.get("size", Vector2(8, 8))
	pos = o["pos"] - size / 2.0
	vel = o.get("vel", Vector2.ZERO)
	dmg = o.get("dmg", 10.0); life = o.get("life", 3.0); kind = o.get("kind", "orb")
	fire = o.get("fire", false); grav = o.get("grav", 0.0)
	color = o.get("color", Color("#ffb060")); trail = o.get("trail", false)
	parryable = o.get("parryable", true); solid = o.get("solid", true); on_wall = o.get("on_wall", "")
	team = "enemy"
	aid = Actor.new_attack_id()
	sh = Data.sheet("fx_proj")

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	if kind != "clod":
		# VS.Gfx.light(cx, cy, 40 + w*2, color, 0.6)
		light = PointLight2D.new()
		light.texture = world.light_tex
		light.color = color
		light.energy = 0.6
		light.texture_scale = (40.0 + size.x * 2.0) / 128.0
		add_child(light)

func tick(dt: float) -> void:
	super.tick(dt)
	life -= dt
	if life <= 0:
		queue_free(); return
	vel.y += grav * dt
	pos += vel * dt
	spin += dt * 8.0
	attack_boxes.clear()
	attack_boxes.append({"rect": Rect2(pos, size), "dmg": dmg, "id": aid, "parryable": parryable, "knock": 150.0, "src": self, "projectile": true, "fire": fire})
	if solid and world.room.solid_at(Vector2(cx, cy)):
		if on_wall == "fire":
			world.spawn_projectile({"pos": Vector2(cx, cy - 6), "size": Vector2(20, 8), "dmg": 8.0, "kind": "fire", "color": Color("#ff6010"), "life": 1.5, "solid": false, "parryable": false, "fire": true})
		world.fx.burst(Vector2(cx, cy), 8, Color(0.45, 0.36, 0.28) if kind == "clod" else color, 90.0, kind != "clod")
		queue_free()
	if trail and randf() < 0.6:
		world.fx.emit({"x": cx, "y": cy, "vx": randf_range(-10, 10), "vy": randf_range(-10, 10), "life": 0.35, "size": size.x * 0.35, "color": color, "add": true, "shrink": true})
	elif fire and randf() < 0.6:
		world.fx.ember(Vector2(cx, cy))

func queue_free_safe() -> void:
	world.fx.burst(Vector2(cx, cy), 8, color, 90.0, true)
	queue_free()

func _process(_d: float) -> void:
	position = draw_anchor(size / 2.0)
	queue_redraw()

func _draw() -> void:
	var def: Array = PROJ.get(kind, [])
	if sh.is_empty() or def.is_empty() or not Data.has_anim(sh, def[0]):
		draw_circle(Vector2.ZERO, size.x / 2, color)
		return
	var f := Data.frame(sh, def[0], t * 12.0)
	var sc := clampf(maxf(size.x, size.y) / float(def[2]), 0.6, 2.4)
	var rot := 0.0
	var sx := sc
	match def[1]:
		"dir": rot = atan2(vel.y, vel.x)
		"flip": sx = -sc if vel.x < 0 else sc
		"spin": rot = t * 6.0
	draw_set_transform(Vector2.ZERO, rot, Vector2(sx, sc))
	Data.draw_frame(self, sh, f)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
