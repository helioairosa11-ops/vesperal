extends Node
## Teste automático (só com --autotest): percorre uma sequência de ações, tira capturas para res://../godot_shots e sai.
## Uso: godot --path godot -- --autotest --room=r1_coveiro --seq=boss

var main
var t := 0.0
var shots_dir := ""
var seq := "walk"
var steps: Array = []
var idx := 0
var log_lines: Array = []
var last_enemy

func _ready() -> void:
	shots_dir = OS.get_environment("SHOTS")
	if shots_dir == "":
		shots_dir = "user://shots"
	DirAccess.make_dir_recursive_absolute(shots_dir)
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--seq="):
			seq = a.substr(6)
	match seq:
		"walk":
			steps = [[0.8, "shot", "01_start"], [0.1, "press", "right"], [1.2, "shot", "02_run"], [0.1, "tap", "jump"], [0.25, "shot", "03_jump"],
				[0.6, "tap", "attack"], [0.12, "shot", "04_attack"], [0.3, "release", "right"], [0.4, "tap", "dodge"], [0.1, "shot", "05_dodge"], [1.0, "shot", "06_end"]]
		"boss":
			steps = [[0.5, "warp", ""], [0.3, "press", "right"], [0.9, "release", "right"], [2.4, "shot", "b01_intro"],
				[0.6, "shot", "b02_fight"], [0.6, "boss_attack", "slam"], [0.5, "shot", "b03_slam_wind"], [0.4, "shot", "b04_slam"],
				[1.0, "boss_attack", "clods"], [0.8, "shot", "b05_clods"], [1.2, "boss_attack", "burrow"], [0.7, "shot", "b06_burrow"], [0.9, "shot", "b07_emerge"],
				[1.2, "boss_hp", "0.45"], [0.6, "shot", "b08_phase2"], [0.2, "parries", "4"], [0.5, "shot", "b09_dazed"],
				[0.3, "tap", "attack"], [0.1, "shot", "b10_attack"], [2.8, "boss_attack", "sweep"], [0.4, "shot", "b11_sweep"],
				[1.0, "boss_hp", "0.0"], [1.6, "shot", "b12_dead"], [1.0, "quit", ""]]
		"play":
			steps = [[0.5, "press", "right"]]
			for i in 24:
				if i % 3 == 0:
					steps.append([0.3, "press", "jump"]); steps.append([0.3, "release", "jump"])
				else:
					steps.append([0.35, "tap", "attack"])
				steps.append([0.25, "shot", "p%02d" % i])
			steps.append([0.2, "release", "right"])
		"fx":
			steps = [[0.5, "room", "r1_street"], [0.3, "spawn", "husk"], [0.1, "enemy_attack", "lunge"], [0.42, "shot", "f01_tell_white"],
				[0.25, "shot", "f02_lunge_act"], [0.8, "spawn", "sexton"], [0.1, "enemy_attack", "slam"], [0.5, "shot", "f03_tell_red"],
				[0.8, "tap", "attack"], [0.07, "shot", "f04_hit"], [0.05, "shot", "f05_hit2"], [0.6, "press", "right"], [0.05, "tap", "dodge"], [0.07, "shot", "f06_dodge_inv"],
				[0.12, "shot", "f07_dodge_end"], [0.1, "release", "right"], [0.4, "tap", "jump"], [0.08, "shot", "f08_jump"], [0.6, "shot", "f09_land"],
				[0.1, "kill", ""], [0.35, "shot", "f10_dissolve"], [0.5, "quit", ""]]
		"regions":
			# uma sala de cada região: confirma a pintura de fundo certa em cada uma
			steps = []
			for r in ["r1_street", "r2_gate", "r3_foundry", "r4_pond", "r5_stairs", "r6_nave", "r6_dome", "r7_hall", "r7_throne", "r1_crypt"]:
				steps.append([0.4, "room", r]); steps.append([0.2, "place", "10"]); steps.append([0.8, "shot", "rg_" + r])
			steps.append([0.2, "quit", ""])
		"r2":
			# inimigos das Muralhas: sentinela de escudo, besteiro e cão
			steps = [[0.4, "room", "r2_wall"], [0.2, "place", "6"], [0.2, "spawn2", "sentinel:5"], [0.05, "spawn2", "crossbow:12"], [0.05, "spawn2", "hound:-6"],
				[1.2, "shot", "e01"], [0.1, "tap", "attack"], [0.2, "shot", "e02_block"], [1.2, "shot", "e03"], [1.5, "shot", "e04"], [0.3, "quit", ""]]
		"r3":
			steps = [[0.4, "room", "r3_foundry"], [0.2, "place", "8"], [0.2, "spawn2", "thrall:5"], [0.05, "spawn2", "smelter:12"], [0.05, "spawn2", "slag:-5"],
				[1.4, "shot", "f01"], [1.4, "shot", "f02"], [1.4, "shot", "f03"], [0.3, "quit", ""]]
		"r4":
			steps = [[0.4, "room", "r4_pond"], [0.2, "place", "10"], [0.2, "spawn2", "thornmaid:3"], [0.05, "spawn2", "drowned:-2"], [0.05, "spawn2", "moth:6"],
				[0.8, "shot", "g01"], [1.2, "shot", "g02"], [1.2, "shot", "g03"], [0.3, "quit", ""]]
		"r5":
			steps = [[0.4, "room", "r5_eaves"], [0.2, "place", "10"], [0.2, "spawn2", "acolyte:6"], [0.05, "spawn2", "raven:-4"], [0.05, "spawn2", "raven:3"],
				[0.8, "shot", "t01"], [1.2, "shot", "t02"], [1.2, "shot", "t03"], [0.3, "quit", ""]]
		"r6":
			steps = [[0.4, "room", "r6_nave"], [0.2, "place", "10"], [0.2, "spawn2", "penitent:6"], [0.05, "spawn2", "vitrail:-5"], [0.05, "spawn2", "choir:3"],
				[0.8, "shot", "c01"], [1.2, "shot", "c02"], [1.2, "shot", "c03"], [0.3, "quit", ""]]
		"r7":
			steps = [[0.4, "room", "r7_hall"], [0.2, "place", "10"], [0.2, "spawn2", "royalguard:6"], [0.05, "spawn2", "torch:-6"], [0.05, "spawn2", "courtier:3"],
				[0.8, "shot", "p01"], [1.2, "shot", "p02"], [1.5, "shot", "p03"], [0.3, "quit", ""]]
		"big":
			# tamanho: rastejante (×1,45), cinzento e os gigantes ao lado da protagonista
			steps = [[0.4, "room", "r1_street"], [0.2, "place", "6"], [0.2, "spawn2", "husk:2"], [0.05, "spawn2", "crawler:4"], [0.05, "spawn2", "sexton:-3"], [0.05, "spawn2", "husk_big:9"],
				[0.5, "shot", "s01"], [0.6, "shot", "s02"], [0.3, "quit", ""]]
		"climb":
			# encosta a uma parede (sala r1_street, muro à direita) e trepa com cima
			steps = [[0.4, "room", "r1_street"], [0.2, "place", "16"], [0.1, "press", "right"], [0.4, "press", "up"], [0.25, "shot", "k01_climb"],
				[0.2, "shot", "k02_climb"], [0.8, "shot", "k03_top"], [0.1, "release", "up"], [0.1, "release", "right"], [0.3, "quit", ""]]
		"items":
			steps = [[0.4, "room", "r1_street"], [0.2, "place", "8"], [0.1, "give", "oil"], [0.1, "give", "incense"], [0.1, "use", "oil"], [0.1, "use", "incense"], [0.6, "shot", "i01_buffs"], [0.3, "quit", ""]]
		"rest":
			steps = [[0.4, "room", "r1_sanct"], [0.2, "place", "14"], [0.6, "tap", "interact"], [1.0, "shot", "a01_rest"], [0.1, "uiact", "0"], [1.0, "shot", "a02_inv"], [0.3, "quit", ""]]
		"walkers":
			steps = [[0.4, "room", "r1_street"], [0.2, "place", "4"], [0.2, "spawn2", "husk:12"], [0.05, "spawn2", "sexton:16"], [0.05, "spawn2", "hound:20"], [0.05, "spawn2", "sentinel:24"],
				[0.35, "shot", "w01"], [0.12, "shot", "w02"], [0.12, "shot", "w03"], [0.12, "shot", "w04"], [0.3, "quit", ""]]
		"npcs":
			# Maren nas Muralhas (dá a medalha), Teodoro na Estufa (escolhe ir ter com a irmã), os dois no Santuário
			steps = [[0.4, "room", "r2_gate"], [0.2, "place", "22"], [0.6, "shot", "m01_maren"], [0.1, "tap", "interact"], [2.0, "shot", "m02_maren_talk"],
				[0.1, "tap", "interact"], [0.4, "tap", "interact"], [0.4, "tap", "interact"], [0.6, "tap", "interact"], [0.8, "shot", "m03_after"],
				[0.3, "room", "r4_greenhouse"], [0.2, "place", "14"], [0.6, "shot", "m04_teodoro"], [0.1, "tap", "interact"], [2.0, "shot", "m05_teo_talk"],
				[0.1, "flag", "q_teodoro=3"], [0.3, "room", "r1_sanct"], [0.2, "place", "5"], [0.8, "shot", "m06_sanct"], [0.1, "tap", "interact"], [2.0, "shot", "m07_maren_shop"], [0.3, "quit", ""]]
		"npc":
			steps = [[0.5, "room", "r1_sanct"], [0.2, "place", "22"], [0.6, "shot", "n01_prompt"], [0.1, "tap", "interact"], [0.6, "shot", "n02_typing"],
				[1.8, "shot", "n03_line1"], [0.1, "tap", "interact"], [0.1, "tap", "interact"], [1.0, "shot", "n04_line2"],
				[0.1, "room", "r1_market"], [0.2, "place", "7"], [0.6, "shot", "n05_hrolf_prompt"], [0.1, "tap", "interact"], [2.0, "shot", "n06_hrolf"], [0.3, "quit", ""]]
		"fuzz":
			# 90 s de jogo ao acaso: corre, salta, ataca, esquiva, apara, cura e muda de sala
			var acts := ["left", "right", "jump", "attack", "dodge", "parry", "heal", "down", "up"]
			var rooms := ["r1_wake", "r1_street", "r1_plaza", "r1_market", "r1_cemetery", "r1_sanct", "r1_chapel", "r1_bridge", "r1_crypt", "r1_belfry", "r1_coveiro"]
			for i in 900:
				if i % 75 == 0:
					steps.append([0.05, "room", rooms[int(i / 75.0) % rooms.size()]])
				var a: String = acts[randi() % acts.size()]
				steps.append([randf_range(0.03, 0.15), "press", a])
				steps.append([randf_range(0.03, 0.2), "release", a])
		"ai":
			steps = [[0.3, "room", "r1_street"], [0.2, "place", "30"], [0.1, "spawn", "husk"], [0.05, "spawn2", "husk:-5"], [0.05, "spawn2", "crawler:6"], [0.05, "spawn2", "sexton:-8"]]
			for i in 12:
				steps.append([0.5, "elog", ""])
				if i == 4: steps.append([0.1, "press", "left"])
				if i == 6: steps.append([0.1, "release", "left"])
				if i % 3 == 2: steps.append([0.05, "tap", "attack"])
			steps.append([0.2, "shot", "ai_end"])
		"rooms":
			steps = [[0.6, "shot", "r_wake"], [0.1, "room", "r1_street"], [0.8, "shot", "r_street"], [0.1, "room", "r1_sanct"], [0.8, "shot", "r_sanct"],
				[0.1, "room", "r1_cemetery"], [0.8, "shot", "r_cemetery"], [0.1, "room", "r1_market"], [0.8, "shot", "r_market"], [0.5, "quit", ""]]
	steps.append([0.5, "quit", ""])

func _process(delta: float) -> void:
	if idx >= steps.size():
		return
	t += delta
	var s: Array = steps[idx]
	if t < s[0]:
		return
	t = 0.0
	idx += 1
	var w = main.world
	match s[1]:
		"shot":
			var img := get_viewport().get_texture().get_image()
			img.save_png(shots_dir.path_join(s[2] + ".png"))
			var p = w.player
			log_lines.append("%s: room=%s hp=%d pos=(%d,%d) ground=%s act=%s" % [s[2], w.room.id, p.hp, p.cx, p.bottom, p.on_ground, p.action.get("type", "")])
			if w.boss and is_instance_valid(w.boss):
				log_lines.append("   boss hp=%d phase=%d atk=%s stagger=%.2f dazed=%s sheet=%s" % [w.boss.hp, w.boss.phase, w.boss.atk.get("name", ""), w.boss.stagger, w.boss.dazed, w.boss.sh["meta"]["name"]])
		"press":
			Input.action_press(s[2])
		"release":
			Input.action_release(s[2])
		"tap":
			Input.action_press(s[2])
			get_tree().create_timer(0.08).timeout.connect(func(): Input.action_release(s[2]))
		"warp":
			w.load_room("r1_coveiro", Vector2.INF)
			w.player.pos = Vector2(8 * 20, 15 * 20 - w.player.size.y)
		"room":
			w.load_room(s[2], Vector2.INF)
		"uiact":
			# carrega na opção n do menu aberto
			var top: Dictionary = UI.stack[-1]
			top["items"][int(s[2])]["action"].call()
		"give":
			GameState.give(String(s[2]))
		"use":
			UI._use({"world": w}, String(s[2]))
		"flag":
			var kv: PackedStringArray = String(s[2]).split("=")
			GameState.flags[kv[0]] = int(kv[1])
		"place":
			var tx := int(s[2])
			w.player.pos = Vector2(tx * 20.0 + 4.0, w.room.floor_below(tx * 20.0 + 10.0, 100.0) - w.player.size.y)
			w.player.vel = Vector2.ZERO
			w.player.facing = 1
		"spawn":
			var en = load("res://scripts/enemy.gd").new()
			en.world = w
			en.setup(s[2], int(w.player.cx / 20.0) + 3, int(w.player.bottom / 20.0) - 1)
			w.actors.add_child(en)
			last_enemy = en
		"enemy_attack":
			if is_instance_valid(last_enemy):
				last_enemy.aggro = true; last_enemy.facing = -1 if last_enemy.cx > w.player.cx else 1
				last_enemy.atk = {}; last_enemy.attack(s[2])
		"spawn2":
			var pr: PackedStringArray = String(s[2]).split(":")
			var en2 = load("res://scripts/enemy.gd").new()
			en2.world = w
			en2.setup(pr[0], int(w.player.cx / 20.0) + int(pr[1]), int(w.player.bottom / 20.0) - 1)
			w.actors.add_child(en2)
		"elog":
			var line := "t=%.1f P(%d)" % [Time.get_ticks_msec() / 1000.0, w.player.cx]
			for a in w.actors.get_children():
				if a != w.player and a.has_method("on_parried"):
					line += " %s(%d,%s,%s)" % [a.kind, a.cx, a.atk.get("name", "-"), "A" if a.aggro else "p"]
			log_lines.append(line)
		"kill":
			for a in w.actors.get_children():
				if a != w.player and a.has_method("die") and not a.dead:
					a.die()
		"boss_attack":
			if w.boss and is_instance_valid(w.boss) and not w.boss.dead:
				w.boss.atk = {}; w.boss.stagger = 0; w.boss.attack(s[2])
		"boss_hp":
			if w.boss and is_instance_valid(w.boss):
				w.boss.hp = w.boss.max_hp * float(s[2])
				if float(s[2]) <= 0.0:
					w.boss.die()
		"parries":
			for i in int(s[2]):
				w.boss.t += 0.5
				w.boss.on_parried()
		"quit":
			var f := FileAccess.open(shots_dir.path_join("log.txt"), FileAccess.WRITE)
			f.store_string("\n".join(log_lines))
			get_tree().quit()
