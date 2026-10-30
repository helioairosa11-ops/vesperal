// Vesperal — versão de computador (Steam): o jogo dentro de uma janela própria (Electron), sem navegador à vista.
// Ecrã inteiro por omissão (F11 ou Alt+Enter alterna, e a escolha fica guardada); as gravações ficam na pasta de
// dados da aplicação (no Windows: %APPDATA%\Vesperal).
'use strict';
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// o som começa sem esperar por um clique, como num jogo normal
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// uma só janela do jogo de cada vez: uma segunda cópia só traz a primeira para a frente
const firstCopy = app.requestSingleInstanceLock();
if (!firstCopy) app.quit();

const cfgPath = () => path.join(app.getPath('userData'), 'janela.json');
function loadCfg() { try { return Object.assign({ fullscreen: true }, JSON.parse(fs.readFileSync(cfgPath(), 'utf8'))); } catch (e) { return { fullscreen: true }; } }
function saveCfg() { try { fs.writeFileSync(cfgPath(), JSON.stringify(cfg)); } catch (e) { /* sem acesso ao disco: não faz mal */ } }

let win = null, cfg = { fullscreen: true };
function setFullscreen(v) { cfg.fullscreen = !!v; saveCfg(); if (win) win.setFullScreen(cfg.fullscreen); }

function createWindow() {
  cfg = loadCfg();
  win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 800, minHeight: 450, useContentSize: true,
    backgroundColor: '#000000', show: false, autoHideMenuBar: true, fullscreen: cfg.fullscreen, title: 'Vesperal',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false },
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'game', 'index.html'));
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && (input.key === 'F11' || (input.alt && input.key === 'Enter'))) { setFullscreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.on('enter-full-screen', () => { cfg.fullscreen = true; saveCfg(); });
  win.on('leave-full-screen', () => { cfg.fullscreen = false; saveCfg(); });
  // ligações externas (créditos, licença) abrem no navegador do sistema, nunca dentro do jogo
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); } });
  win.on('closed', () => { win = null; });
}

ipcMain.on('vesperal:quit', () => app.quit());
ipcMain.on('vesperal:fullscreen', (e, v) => setFullscreen(v));
ipcMain.on('vesperal:is-fullscreen', (e) => { e.returnValue = !!cfg.fullscreen; });

if (firstCopy) {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
