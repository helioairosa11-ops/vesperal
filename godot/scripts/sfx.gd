extends Node
## Sons sintetizados no arranque (como no jogo web, que gera o áudio por código): golpes, passos, aparo, rugido...

const RATE := 22050
var streams: Dictionary = {}
var players: Array = []

func _ready() -> void:
	for i in 10:
		var p := AudioStreamPlayer.new()
		p.volume_db = -6.0
		add_child(p)
		players.append(p)
	streams["swing"] = _make(0.14, func(_x, k): return _noise() * (1.0 - k) * 0.5 * sin(PI * k), 2400.0)
	streams["swing_enemy"] = _make(0.2, func(_x, k): return _noise() * (1.0 - k) * 0.45 * sin(PI * k), 1400.0)
	streams["swing_heavy"] = _make(0.32, func(_x, k): return _noise() * (1.0 - k) * 0.55 * sin(PI * k), 800.0)
	streams["hit"] = _make(0.16, func(x, k): return (_noise() * 0.6 + sin(x * 180.0 * TAU) * 0.6) * pow(1.0 - k, 3.0), 3000.0)
	streams["parry"] = _make(0.6, func(x, k): return (sin(x * 1320.0 * TAU) * 0.4 + sin(x * 1980.0 * TAU) * 0.3 + _noise() * 0.3 * (1.0 - k * 4.0 if k < 0.25 else 0.0)) * pow(1.0 - k, 2.0), 0.0)
	streams["jump"] = _make(0.09, func(_x, k): return _noise() * 0.25 * (1.0 - k), 1200.0)
	streams["dodge"] = _make(0.22, func(_x, k): return _noise() * 0.35 * sin(PI * k), 900.0)
	streams["hurt"] = _make(0.25, func(x, k): return (sin(x * 110.0 * TAU) * 0.6 + _noise() * 0.4) * pow(1.0 - k, 2.0), 1800.0)
	streams["crush"] = _make(0.5, func(x, k): return (_noise() * 0.7 + sin(x * 55.0 * TAU) * 0.6) * pow(1.0 - k, 2.5), 600.0)
	streams["roar"] = _make(1.1, func(x, k): return (sin(x * (90.0 - 30.0 * k) * TAU + sin(x * 7.0 * TAU) * 2.0) * 0.5 + _noise() * 0.35) * sin(PI * minf(1.0, k * 1.4)), 900.0)
	streams["heal"] = _make(0.7, func(x, k): return (sin(x * (440.0 + 220.0 * k) * TAU) * 0.25 + sin(x * 660.0 * TAU) * 0.15) * sin(PI * k), 0.0)
	streams["kill"] = _make(0.35, func(_x, k): return _noise() * 0.4 * pow(1.0 - k, 2.0), 1100.0)
	streams["danger"] = _make(0.35, func(x, k): return sin(x * 220.0 * TAU) * 0.35 * (1.0 if fmod(k, 0.5) < 0.25 else 0.4) * (1.0 - k), 0.0)
	streams["stagger"] = _make(0.5, func(x, k): return (sin(x * 880.0 * TAU) * 0.3 + sin(x * 1100.0 * TAU) * 0.2) * pow(1.0 - k, 1.5), 0.0)
	streams["door"] = _make(0.9, func(x, k): return (_noise() * 0.5 + sin(x * 70.0 * TAU) * 0.4) * (1.0 - k), 500.0)
	streams["ui"] = _make(0.08, func(x, k): return sin(x * 700.0 * TAU) * 0.2 * (1.0 - k), 0.0)

var _seed := 1234567
func _noise() -> float:
	_seed = (_seed * 1103515245 + 12345) & 0x7fffffff
	return float(_seed) / float(0x3fffffff) - 1.0

## gera PCM 16 bits; lp = corte de um passa-baixo simples (0 = sem filtro)
func _make(dur: float, fn: Callable, lp: float) -> AudioStreamWAV:
	var n := int(dur * RATE)
	var data := PackedByteArray()
	data.resize(n * 2)
	var y := 0.0
	var a := 1.0 if lp <= 0.0 else clampf(lp / RATE * TAU, 0.0, 1.0)
	for i in n:
		var x := float(i) / RATE
		var v: float = fn.call(x, float(i) / n)
		y += (v - y) * a
		data.encode_s16(i * 2, int(clampf(y, -1.0, 1.0) * 30000.0))
	var s := AudioStreamWAV.new()
	s.format = AudioStreamWAV.FORMAT_16_BITS
	s.mix_rate = RATE
	s.stereo = false
	s.data = data
	return s

func sfx(nm: String, vol := 1.0) -> void:
	if not streams.has(nm):
		return
	for p in players:
		if not p.playing:
			p.stream = streams[nm]
			p.volume_db = linear_to_db(vol) - 6.0
			p.pitch_scale = randf_range(0.94, 1.06)
			p.play()
			return
