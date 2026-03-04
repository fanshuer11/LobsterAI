/**
 * Minimal Electron mock for running main-process unit tests in plain Node.js.
 *
 * Only the APIs actually called during test-time module loading and by the
 * __testUtils helpers need to be stubbed here.  Real Electron-specific
 * behaviour (IPC, windows, etc.) is not exercised by the unit tests.
 */
'use strict';

const path = require('path');
const os = require('os');

const APP_USER_DATA = path.join(os.tmpdir(), 'lobsterai-test-userdata');

const app = {
  isPackaged: false,
  getPath(name) {
    const map = {
      userData: APP_USER_DATA,
      home: os.homedir(),
      temp: os.tmpdir(),
      appData: path.join(os.tmpdir(), 'lobsterai-test-appdata'),
      logs: path.join(os.tmpdir(), 'lobsterai-test-logs'),
    };
    return map[name] ?? os.tmpdir();
  },
  getAppPath() {
    return path.join(__dirname, '..');
  },
  getName() { return 'LobsterAI'; },
  getVersion() { return '0.0.0-test'; },
  on() {},
  once() {},
  quit() {},
};

const BrowserWindow = {
  getAllWindows() { return []; },
};

const session = {
  defaultSession: {
    fetch: async (url, options) => {
      throw new Error(`electron.session.fetch called in test context: ${url}`);
    },
    webRequest: {
      onHeadersReceived() {},
    },
    setProxy() {},
  },
};

const ipcMain = {
  handle() {},
  on() {},
  once() {},
  removeAllListeners() {},
};

const ipcRenderer = {
  invoke() { return Promise.resolve(); },
  on() {},
  once() {},
  send() {},
  removeAllListeners() {},
};

const dialog = {
  showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
  showSaveDialog: async () => ({ canceled: true }),
  showMessageBox: async () => ({ response: 0 }),
};

const shell = {
  openPath: async () => '',
  showItemInFolder() {},
  openExternal: async () => {},
};

const nativeTheme = {
  shouldUseDarkColors: false,
  themeSource: 'system',
  on() {},
};

const powerSaveBlocker = {
  start() { return 0; },
  stop() {},
  isStarted() { return false; },
};

const autoUpdater = {
  on() {},
  once() {},
  checkForUpdates() {},
  setFeedURL() {},
};

const Tray = class {
  constructor() {}
  setImage() {}
  setToolTip() {}
  setContextMenu() {}
  on() {}
  destroy() {}
};

const Menu = {
  buildFromTemplate() { return {}; },
  setApplicationMenu() {},
};

const contextBridge = {
  exposeInMainWorld() {},
};

const electronMock = {
  app,
  BrowserWindow,
  session,
  ipcMain,
  ipcRenderer,
  dialog,
  shell,
  nativeTheme,
  powerSaveBlocker,
  autoUpdater,
  Tray,
  Menu,
  contextBridge,
};

// Register the mock so that any `require('electron')` call resolves to it
require.cache[require.resolve('module')]; // ensure Module is loaded
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'electron') {
    return electronMock;
  }
  return originalLoad.call(this, request, parent, isMain);
};
