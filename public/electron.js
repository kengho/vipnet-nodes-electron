const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const isDev = require('electron-is-dev')

const contextMenu = require('electron-context-menu')
contextMenu()

const windowStateKeeper = require('electron-window-state')
let mainWindow

function createWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 680,
    defaultHeight: 680
  })

  mainWindow = new BrowserWindow({
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height,
    webPreferences: {
      nodeIntegration: true,
    },
    icon: __dirname + '/favicon.ico',
  })
  mainWindowState.manage(mainWindow)
  // mainWindow.removeMenu()
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`)
  if (isDev) {
    // Open the DevTools.
    // BrowserWindow.addDevToolsExtension('<location to your react chrome extension>')
    mainWindow.webContents.openDevTools()
  }
  mainWindow.on('closed', () => {mainWindow = null})
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
