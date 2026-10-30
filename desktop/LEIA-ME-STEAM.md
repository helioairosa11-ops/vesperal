# Vesperal na Steam — como criar a versão de computador

Este pacote traz o jogo completo (pasta `game/`) e uma "casca" de computador feita com **Electron** — a mesma
tecnologia de programas como o Visual Studio Code ou o Discord. O resultado é um `Vesperal.exe` normal: abre em ecrã
inteiro, sem navegador à vista, com teclado e comando a funcionar como no navegador, e com "Sair do jogo" no menu.

> **O jogo ainda está em desenvolvimento** (falta o teste completo de uma partida do início ao fim e os últimos
> acertos). Usa este pacote para testar e preparar a página da Steam; põe à venda só quando o jogo estiver acabado.

## 1. Experimentar no teu PC

1. Instala o **Node.js** (versão LTS): https://nodejs.org
2. Abre esta pasta num terminal (no Windows: botão direito dentro da pasta → *Abrir no Terminal*).
3. `npm install` — só da primeira vez; descarrega o Electron (cerca de 100 MB).
4. `npm start` — o jogo abre em ecrã inteiro. **F11** ou **Alt+Enter** alterna entre janela e ecrã inteiro.

## 2. Criar o executável

| Sistema | Comando | Resultado |
|---|---|---|
| Windows | `npm run steam:windows` | `dist/win-unpacked/` com o `Vesperal.exe` |
| Linux / Steam Deck | `npm run steam:linux` | `dist/linux-unpacked/` com o executável `vesperal` |
| macOS (num Mac) | `npm run steam:mac` | `dist/mac/` (para vender no Mac, a Apple exige assinatura e notarização) |

É a **pasta inteira** que vai para a Steam, não só o `.exe`. A Steam Deck também corre a versão de Windows (Proton).

## 3. Pôr na Steam

1. Cria a conta de parceiro em https://partner.steamgames.com e paga a taxa do Steam Direct (é por jogo).
2. Cria a aplicação. Em **SteamPipe → Depots** cria um depósito para Windows (e outro para Linux, se quiseres).
3. Em **Installation → General Installation → Launch Options**: Windows → `Vesperal.exe`; Linux → `vesperal`.
4. Instala o **SteamCMD** (vem no Steamworks SDK). Em `steam/app_build.vdf`, troca `1000000` pelo número da tua
   aplicação e `1000001`/`1000002` pelos números dos depósitos. Depois, numa linha de comandos (cmd) dentro da pasta
   `steam`:
   `steamcmd +login O_TEU_UTILIZADOR +run_app_build "%CD%\app_build.vdf" +quit`
5. No Steamworks, em **Builds**, põe a versão enviada num ramo de testes e, quando estiver tudo bem, no `default`.
6. **Gravações na nuvem (opcional):** Steam Cloud → Auto-Cloud: raiz `WinAppDataRoaming`, subpasta
   `Vesperal/Local Storage`, padrão `*`, com subpastas.

## 4. Imagens da página da Steam

Tamanhos pedidos pela Steam (confirma sempre em https://partner.steamgames.com/doc/store/assets — mudam de vez em quando):

| Imagem | Tamanho |
|---|---|
| Cápsula do cabeçalho | 920 × 430 |
| Cápsula pequena | 462 × 174 |
| Cápsula principal | 1232 × 706 |
| Cápsula vertical | 748 × 896 |
| Capturas de ecrã (pelo menos 5) | 1920 × 1080 ou mais, 16:9 |
| Fundo da página (opcional) | 1438 × 810 |
| Biblioteca — cápsula | 600 × 900 |
| Biblioteca — herói | 3840 × 1240 (PNG) |
| Biblioteca — logótipo | 1280 de largura e/ou 720 de altura (PNG transparente) |
| Biblioteca — cabeçalho | 920 × 430 |
| Ícone do atalho | 256 × 256 (.ico ou .png) — podes usar `build/icon.png` |
| Ícone da aplicação | 184 × 184 (.jpg) |
| Capa de evento | 800 × 450 |

## 5. Onde ficam as coisas

- Gravações: `%APPDATA%\Vesperal\Local Storage` (Windows) e `~/.config/Vesperal` (Linux).
- A escolha de ecrã inteiro: `janela.json`, na mesma pasta.
- Para atualizar o jogo: substitui a pasta `game/` pela versão nova (dentro do repositório do jogo,
  `npm run copiar-jogo` copia o jogo da pasta de cima).

## 6. Perguntas

**Preciso de Unity ou Unreal para estar na Steam?** Não. A Steam aceita qualquer executável; jogos feitos em
JavaScript chegam lá assim, dentro de uma casca como esta. Passar para Unity ou Unreal seria reescrever o jogo todo
noutra linguagem — não o torna maior nem melhor por si; o tamanho de um jogo vem do conteúdo (regiões, chefes,
missões), não do motor.

**Posso vender o jogo, com a licença CC BY-NC-SA?** A licença diz o que **os outros** podem fazer com o jogo (não o
podem vender). Tu és o autor e podes vender o teu próprio jogo. As fontes (Cinzel e EB Garamond) são SIL OFL 1.1: podem
ir dentro de um jogo vendido, só não se podem vender sozinhas. Isto não é aconselhamento jurídico.
