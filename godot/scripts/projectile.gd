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

func setup(o: Dictionary) -> void:
	size = o.get("size", Vector2(8, 8))
	pos = o["pos"] - size / 2.0
	vel = o.get("vel", Vector2.ZERO)
	dmg = o.get("dmg", 10.0); life = o.get("life", 3.0); kind = o.get("kind", "orb")
	fire = o.get("fire", false); grav = o.get("grav", 0.0)
	team = "enemy"
	aid = Actor.new_attack_id()
	sh = Data.sheet("fx_proj")

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	if fire or kind == "fire":
		light = PointLight2D.new()
		light.texture = world.light_tex
		light.color = Color(1, 0.55, 0.2)
		light.energy = 0.9
		light.texture_scale = 0.45
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
	attack_boxes.append({"rect": Rect2(pos, size), "dmg": dmg, "id": aid, "parryable": true, "knock": 150.0, "src": self, "projectile": true, "fire": fire})
	if world.room.solid_at(Vector2(cx, cy)):
		world.fx.burst(Vector2(cx, cy), 8, Color(0.45, 0.36, 0.28) if kind == "clod" else Color(1, 0.6, 0.3), 90.0, fire)
		queue_free()
	if fire and randf() < 0.6:
		world.fx.ember(Vector2(cx, cy))

func queue_free_safe() -> void:
	world.fx.sparks(Vector2(cx, cy), 8)
	queue_free()

func _process(_d: float) -> void:
	position = Vector2(cx, cy)
	queue_redraw()

func _draw() -> void:
	var anim := kind
	if sh.is_empty() or not Data.has_anim(sh, anim):
		draw_circle(Vector2.ZERO, size.x / 2, Color(0.4, 0.33, 0.26))
		return
	var f := Data.frame(sh, anim, t * 12.0)
	var r := Data.frame_rect(sh, f)
	var sc := clampf(maxf(size.x, size.y) / maxf(1.0, maxf(r.size.x, r.size.y)) * 1.3, 0.5, 2.4)
	draw_set_transform(Vector2.ZERO, spin if kind == "clod" else 0.0, Vector2(sc, sc))
	Data.draw_frame(self, sh, f, Color(1.3, 1.1, 1.0) if fire else Color.WHITE)
	draw_set_transform(Vector2.ZERO, 0, Vector2.ONE)
