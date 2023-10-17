'use strict'

import {
  app,
  protocol,
  BrowserWindow,
  ipcMain,
  dialog,
  shell
} from 'electron'
import {
  createProtocol
} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {
  VUEJS3_DEVTOOLS
} from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
let mainWin;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    secure: true,
    standard: true
  }
}])

async function createWindow() {
  // Create the browser window.
  mainWin = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      // 允许img标签访问本地图片
      webSecurity: false,
      spellcheck: false,
    }
  })
  // win.maximize();
  if (!isDevelopment) {
    mainWin.setMenuBarVisibility(false);
  }

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWin.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    mainWin.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      // await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipcMain.handle('close-app', (event, arg) => {
  if (mainWin) {
    mainWin.close();
  }
})

ipcMain.handle('minimize-app', (event, arg) => {
  mainWin.minimize();
})

ipcMain.handle('open-devtools', (event, arg) => {
  mainWin.openDevTools();
})

ipcMain.handle('reload', (event, arg) => {
  mainWin.reload();
})

ipcMain.handle('choose-direcotry', (event, arg) => {
  mainWin.focus();
  let path = dialog.showOpenDialogSync(mainWin, {
    defaultPath: arg ? arg : '',
    properties: ['openDirectory']
  })
  return new Promise((resolve, reject) => {
    if (!path) {
      // reject();
      resolve(null);
    } else {
      resolve(path[0]);
    }
  });
})

ipcMain.handle('choose-file', (event, arg) => {
  mainWin.focus();
  let path = dialog.showOpenDialogSync(mainWin, {
    defaultPath: arg ? arg : '',
    properties: ['openFile']
  })
  return new Promise((resolve, reject) => {
    if (!path) {
      // reject();
      resolve(null);
    } else {
      resolve(path[0]);
    }
  });
})

ipcMain.handle('save-file', (event, arg) => {
  mainWin.focus();
  let path = dialog.showSaveDialogSync(mainWin, {
    defaultPath: arg ? arg : '',
  })
  return new Promise((resolve, reject) => {
    if (!path) {
      // reject();
      resolve(null);
    } else {
      resolve(path);
    }
  });
})

ipcMain.handle('open-path', (event, arg) => {
  return shell.openPath(arg);
})


ipcMain.handle('show-item-in-folder', (event, arg) => {
  return shell.showItemInFolder(arg);
})

