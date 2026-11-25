# Vesperal: A Última Chama — versão Godot (em construção)

Abre esta pasta no **Godot 4.7** (Importar → escolhe `project.godot`) e carrega em **F5**.

## O que já está nesta versão (fase 1)
- Região 1 (Cidade Cinzenta, Santuário, Cemitério...) com as salas do jogo web convertidas automaticamente (`data/rooms.json`).
- A protagonista com a arte nova (hero2): correr, saltar, parede, esquiva, combo de espada (3 golpes, ar, cima, baixo/ressalto), aparo com contra-ataque, cura nos círios, queimadura.
- Inimigos da Região 1: Cinzento, Cinzento gigante, Rastejante, Fátuo, Sacristão.
- O Coveiro nas duas fases: golpe de cima (costas expostas), varrida, torrões rentes ao chão, enterrar-se; na 2.ª fase troca para a folha em brasa, recupera 20% da vida uma vez e queima; 3 aparos (4 na 2.ª fase) deixam-no atordoado.
- Luzes 2D (brasa no peito, altares, candeeiros, olhos), partículas, tremor, paragem de impacto, HUD com a arte do jogo, menu, gravação nos altares (tecla E).

## Teclas
A/D ou setas: andar · Espaço: saltar · J: atacar · L/Shift: esquivar · I: aparar · F: curar · E: descansar/ler · comando também funciona.

## Dados
`python3 tools/export_godot_data.py` (na raiz do repositório) volta a gerar `godot/data/*.json` a partir do jogo web.
