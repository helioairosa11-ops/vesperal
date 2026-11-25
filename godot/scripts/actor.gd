class_name Actor
extends Node2D
## Base de tudo o que se mexe na sala: corpo AABB (pos = canto superior esquerdo), velocidade, vida, golpes.

static var _seq := 1

var world                      # nó World
var pos := Vector2.ZERO
var size := Vector2(12, 30)
var vel := Vector2.ZERO
var on_ground := false
var drop_through := false
var facing := 1
var gravity := 1350.0
var max_fall := 520.0
var hp := 1.0
var max_hp := 1.0
var flash := 0.0
var t := 0.0
var dead := false
var team := "neutral"
var attack_boxes: Array = []   # [{rect, dmg, id, parryable, unblockable, knock, fire, src}]
var hit_ids: Dictionary = {}

static func new_attack_id() -> int:
	_seq += 1
	return _seq

var cx: float:
	get: return pos.x + size.x / 2.0
var cy: float:
	get: return pos.y + size.y / 2.0
var bottom: float:
	get: return pos.y + size.y

func hurtbox() -> Rect2:
	return Rect2(pos, size)

func already_hit(aid: int) -> bool:
	if hit_ids.has(aid):
		return true
	hit_ids[aid] = t
	if hit_ids.size() > 30:
		hit_ids.erase(hit_ids.keys()[0])
	return false

func physics(dt: float, no_gravity := false) -> Dictionary:
	if not no_gravity:
		vel.y = minf(max_fall, vel.y + gravity * dt)
	return world.room.move_body(self, dt)

## chamado pelo World a cada passo (respeita a paragem de impacto)
func tick(dt: float) -> void:
	t += dt
	flash = maxf(0.0, flash - dt)

func sync_node() -> void:
	position = Vector2(cx, bottom)
	queue_redraw()

## caixa à frente do corpo (dx a partir do centro, dy a partir dos pés)
func front(dx: float, dy: float, w: float, h: float) -> Rect2:
	var x := cx + dx if facing > 0 else cx - dx - w
	return Rect2(x, bottom - dy - h, w, h)
