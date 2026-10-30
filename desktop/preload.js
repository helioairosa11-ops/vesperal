// Vesperal — ponte mínima entre o jogo e a janela: sair, ecrã inteiro. Nada mais do computador fica ao alcance da página.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('vesperalDesktop', {
  quit: () => ipcRenderer.send('vesperal:quit'),
  setFullscreen: (v) => ipcRenderer.send('vesperal:fullscreen', !!v),
  isFullscreen: () => ipcRenderer.sendSync('vesperal:is-fullscreen'),
});
