# Vesperal: A Última Chama

> **Versão em desenvolvimento.** O jogo ainda não está terminado: falta o teste completo de uma partida do início ao fim (no computador e no telemóvel) e os últimos acertos de dificuldade e de fluidez.

Metroidvania 2D de fantasia sombria para o navegador. O Desperto acorda numa cova de cinza, sem nome nem memória, com uma pequena chama no peito, e atravessa uma cidade morta até ao trono de Aldric.

- 7 regiões ligadas num só mapa, com altares de brasas, paredes falsas e passagens secretas
- 16 chefes, cada um com a sua música, golpes que não se repetem de chefe para chefe, um ponto fraco que se vê na luta e uma dica
- O rei final é o chefe mais difícil: muito mais vida, três fases cada vez mais rápidas e os poderes roubados a quase todos os guardiões (covas que rebentam, mastins de chama, grelhas de fogo, espiral de escamas, sinos, muros de fogo, remoinho do montante, o grito, os raios de sol, a parede de penas) — mais um golpe que mata de uma vez, bem avisado e possível de evitar
- O Eco de Seraphine tem poderes que mais ninguém tem: para o tempo (o mundo fica cinzento e as lanças de luz ficam suspensas à tua volta — sai pela falha antes que o tempo volte) e desfaz o tempo (a luz que já passou volta para trás)
- Chefes que não ficam parados a levar golpes: aceleram à medida que perdem vida e, se os atacas sem parar, carregam uma onda de choque (vê-se a carregar; esquiva-te ou afasta-te)
- A Ama Elowen mergulha na terra e rebenta debaixo de ti, chicoteia e lança ondas de raízes e anéis de espinhos — tudo em área, tudo esquivável
- Corvin, o trovador, desce dos balcões e luta no chão com combos de alaúde; depois do golpe grande fica atordoado, e as notas dele partem-se com a espada ou devolvem-se com um parry
- Sensação de jogo afinada: queda mais pesada, salto que perdoa (coyote time e memória do botão), investida com rasto, pausas de impacto nos golpes fortes, a câmara olha para onde vais e setas vermelhas apontam inimigos voadores fora do ecrã
- Cenas finais pintadas de novo para os três finais
- O Custódio de Ouro, chefe opcional escondido numa cúpula por cima da nave da Catedral: todo ele luz, as armas atravessam-no — só o parry o fere. Aparece ao teu lado com uma lâmina de luz, apaga a cúpula num eclipse em que só o brilho da lâmina avisa, e ainda tem raios a girar, colunas de luz e lâminas de ouro que se devolvem com um parry
- A Carpideira, chefe errante: aparece em salas ao acaso (ouve-se o choro antes de a ver) e grita de sofrimento — o grito sai em ondas que só a esquiva atravessa; pode-se fugir dela, e volta com a vida que tinha
- Inimigos gigantes, um por região — maiores, mais lentos a armar o golpe e muito mais duros; os inimigos com garras também são maiores
- Missões dos NPC e 3 finais
- Todo o mapa percorre-se a saltar (com o salto duplo e a investida quando os ganhas); trepar paredes é um atalho opcional
- Plataformas sempre presas a alguma coisa (mísulas, correntes, cordas ou prumos), com estilos diferentes em cada região
- Fundos pintados em paralaxe, um mundo por região, no espírito barroco e penitente: a Mãe das Dores colossal com as sete espadas e a catedral contra o poente, com a procissão a passar na ponte; o Vigia de lanterna erguida na tempestade; a santa de pedra afundada nos Jardins; o braço com o círio aceso acima das nuvens; a Virgem da lua; o sol negro sobre o palácio. O fundo continua de sala para sala
- Mundo vivo: nos fundos passa a procissão na ponte, voam bandos de aves, caem relâmpagos, tremem tochas e pirilampos; nas salas há corvos, pombas, ratos, morcegos e peixes que fogem quando o Desperto se aproxima, e a erva do primeiro plano dobra-se ao vento
- Construções de cada região atrás da ação (casas, calvário, túmulos, torre de vigia, trabuquete, fornalha, grua, fonte, pérgula, sinos, engrenagens, retábulo, órgão, arcada, estátua do rei)
- Armadilhas a combinar com a zona: sinos e incensários a balançar, ossos e espinhos que rompem do chão, seteiras, grade levadiça, prensas, lanças nas paredes
- Esquiva, parry e guarda, armas com ritmos diferentes
- Português, English, Español e Français
- Música e sons sintetizados em tempo real (Web Audio), sem ficheiros de áudio
- Teclado, comando e ecrã tátil; gravação automática no navegador
- Ocupa o ecrã todo, sem barras pretas: telemóveis largos, monitores ultralargos e tablets 4:3 veem mais do mundo em vez de faixas vazias
- Funciona sem internet: tudo vem dentro do jogo, incluindo as fontes
- Versão de computador para a Steam (pasta `desktop/`): ecrã inteiro, "Sair do jogo" no menu, gravações na pasta da aplicação

## Jogar

O jogo é uma página estática: não precisa de instalação nem de servidor próprio.

- **Online:** https://helioairosa11-ops.github.io/vesperal/ (GitHub Pages, publicado a partir da branch `gh-pages`).
- **No computador:** descarrega o repositório e abre o `index.html` no navegador (ou serve a pasta com `python3 -m http.server 8000` e abre `http://localhost:8000`).
- **Versão de computador / Steam:** ver [`desktop/LEIA-ME-STEAM.md`](desktop/LEIA-ME-STEAM.md) — com o Node.js instalado, `npm install` e `npm run steam:windows` dentro de `desktop/` criam o `Vesperal.exe`.

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
| `tools/steam/` | imagens da página da Steam desenhadas com a arte do jogo (`capsulas.py`) e os pacotes zip (`empacotar.py`) |
| `desktop/` | versão de computador (Electron) para a Steam, com o guia `LEIA-ME-STEAM.md` |
| `tests/` | testes automáticos com Playwright (`python3 tests/gameplay.py`) e validador do mapa (`node tests/validate.js`) |

As fontes Cinzel e EB Garamond (SIL Open Font License 1.1) vêm dentro do jogo, em `css/fonts.css`; as licenças estão em `assets/fonts/`.

## Créditos

Um jogo de **Lourence Manuel**.

## Licença

[CC BY-NC-SA 4.0](LICENSE) — podes jogar, partilhar e adaptar o jogo, desde que dês o crédito ao autor, não o uses para fins comerciais e partilhes as adaptações com a mesma licença. As fontes (Cinzel e EB Garamond) têm a sua própria licença, a SIL Open Font License 1.1 (`assets/fonts/OFL-*.txt`).
