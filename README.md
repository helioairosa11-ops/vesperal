# Vesperal: A Última Chama

> **Versão em desenvolvimento.** O jogo ainda não está terminado: faltam os fundos novos das regiões e o teste completo de uma partida do início ao fim.

Metroidvania 2D de fantasia sombria para o navegador. O Desperto acorda numa cova de cinza, sem nome nem memória, com uma pequena chama no peito, e atravessa uma cidade morta até ao trono de Aldric.

- 7 regiões ligadas num só mapa, com altares de brasas, paredes falsas e passagens secretas
- 16 chefes, cada um com a sua música, golpes que não se repetem de chefe para chefe, um ponto fraco que se vê na luta e uma dica
- O rei final tem um golpe que mata de uma vez, bem avisado e possível de evitar
- O Custódio de Ouro, chefe opcional escondido numa cúpula por cima da nave da Catedral: sem pontos fracos, todo ele luz — raios a girar, colunas de luz, lâminas de ouro que se devolvem com um parry
- A Carpideira, chefe errante: aparece em salas ao acaso (ouve-se o choro antes de a ver) e grita de sofrimento — o grito sai em ondas que só a esquiva atravessa; pode-se fugir dela, e volta com a vida que tinha
- Inimigos gigantes, um por região — maiores, mais lentos a armar o golpe e muito mais duros; os inimigos com garras também são maiores
- Missões dos NPC e 3 finais
- Todo o mapa percorre-se a saltar (com o salto duplo e a investida quando os ganhas); trepar paredes é um atalho opcional
- Plataformas sempre presas a alguma coisa (mísulas, correntes, cordas ou prumos), com estilos diferentes em cada região
- Construções de cada região atrás da ação (casas, calvário, túmulos, torre de vigia, trabuquete, fornalha, grua, fonte, pérgula, sinos, engrenagens, retábulo, órgão, arcada, estátua do rei)
- Armadilhas a combinar com a zona: sinos e incensários a balançar, ossos e espinhos que rompem do chão, seteiras, grade levadiça, prensas, lanças nas paredes
- Esquiva, parry e guarda, armas com ritmos diferentes
- Português, English, Español e Français
- Música e sons sintetizados em tempo real (Web Audio), sem ficheiros de áudio
- Teclado, comando e ecrã tátil; gravação automática no navegador

## Jogar

O jogo é uma página estática: não precisa de instalação nem de servidor próprio.

- **Online:** https://helioairosa11-ops.github.io/vesperal/ (GitHub Pages, publicado a partir da branch `gh-pages`).
- **No computador:** descarrega o repositório e serve a pasta com um servidor local, por exemplo `python3 -m http.server 8000`, e abre `http://localhost:8000`.

### Controlos (teclado, por omissão)

| Ação | Teclas |
|---|---|
| Mover | A / D ou setas |
| Saltar | Espaço ou Z |
| Atacar | J, X ou clique esquerdo |
| Ataque pesado | K ou V |
| Esquiva | L, Shift ou C |
| Parry / guarda | I, B ou clique direito |
| Curar | F |
| Feitiço | Q |
| Interagir | E |
| Inventário / mapa / pausa | Tab / M / Esc |

Os controlos podem ser alterados em *Definições → Controlos*. Em *Definições → Vídeo* há qualidade gráfica, limite de FPS e partículas.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `index.html`, `css/`, `js/` | o jogo (JavaScript sem bibliotecas, Canvas 2D) |
| `assets/` | folhas de sprites, ícones e HUD gerados pelo atelier |
| `tools/art/` | atelier que desenha as personagens, chefes, armas e ícones (`build.py`) |
| `tools/reach/` | verificador de alcance: simula os saltos com a física do jogo e lista o que não se alcança (`node tools/reach/reach.js`) |
| `tools/cover/` | capa (trabalho em pausa) |
| `tests/` | testes automáticos com Playwright (`python3 tests/gameplay.py`) e validador do mapa (`node tests/validate.js`) |

As fontes Cinzel e EB Garamond são carregadas do Google Fonts.

## Créditos

Um jogo de **Lourence Manuel**.

## Licença

[CC BY-NC-SA 4.0](LICENSE) — podes jogar, partilhar e adaptar o jogo, desde que dês o crédito ao autor, não o uses para fins comerciais e partilhes as adaptações com a mesma licença. As fontes (Cinzel e EB Garamond, do Google Fonts) têm a sua própria licença (SIL Open Font License 1.1).
