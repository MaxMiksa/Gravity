import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { createApplicationMenu } from './menu'
import { registerIpcHandlers } from './ipc'
import { createTray, destroyTray } from './tray'
import { createSplashWindow, closeSplashWindow } from './splash'

let mainWindow: BrowserWindow | null = null

/**
 * Get the appropriate app icon path for the current platform
 */
function getIconPath(): string {
  const resourcesDir = join(__dirname, '../resources')

  if (process.platform === 'darwin') {
    return join(resourcesDir, 'icon.icns')
  } else if (process.platform === 'win32') {
    return join(resourcesDir, 'icon.ico')
  } else {
    return join(resourcesDir, 'icon.png')
  }
}

function createWindow(): void {
  const iconPath = getIconPath()
  const iconExists = existsSync(iconPath)

  if (!iconExists) {
    console.warn('App icon not found at:', iconPath)
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: iconExists ? iconPath : undefined,
    show: false, // Don't show until ready
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset', // macOS style
    trafficLightPosition: { x: 18, y: 18 },
    vibrancy: 'under-window', // macOS glass effect
    visualEffectState: 'active',
  })

  // Load the renderer
  const isDev = !app.isPackaged
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, 'renderer', 'index.html'))
  }

  // Show main window when ready and close splash
  mainWindow.once('ready-to-show', () => {
    // Small delay to ensure smooth transition
    setTimeout(() => {
      closeSplashWindow()
      mainWindow?.show()
    }, 500)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // Create splash screen first
  createSplashWindow()

  // Create application menu
  const menu = createApplicationMenu()
  Menu.setApplicationMenu(menu)

  // Register IPC handlers
  registerIpcHandlers()

  // Set dock icon on macOS (required for dev mode, bundled apps use Info.plist)
  if (process.platform === 'darwin' && app.dock) {
    const dockIconPath = join(__dirname, '../resources/icon.png')
    if (existsSync(dockIconPath)) {
      app.dock.setIcon(dockIconPath)
    }
  }

  // Create system tray icon
  createTray()

  // Create main window (will be shown when ready)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // Clean up system tray before quitting
  destroyTray()
})
