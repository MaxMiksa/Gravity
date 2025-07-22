import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { createApplicationMenu } from './menu'
import { registerIpcHandlers } from './ipc'
import { createTray, destroyTray } from './tray'

let mainWindow: BrowserWindow | null = null
// 标记是否真正要退出应用（用于区分关闭窗口和退出应用）
let isQuitting = false

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

  // Show main window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // macOS: 点击关闭按钮时隐藏窗口而不是退出（除非正在退出应用）
  // 开发模式下直接关闭以简化调试
  if (process.platform === 'darwin' && !isDev) {
    mainWindow.on('close', (event) => {
      if (!isQuitting) {
        event.preventDefault()
        mainWindow?.hide()
        // 隐藏 Dock 图标，让应用完全进入后台
        app.dock?.hide()
      }
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
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
  // 开发模式下或非 macOS：关闭所有窗口时退出应用
  // 生产模式 macOS：保持应用运行（可通过 tray 或 Dock 重新打开）
  const isDev = !app.isPackaged
  if (process.platform !== 'darwin' || isDev) {
    app.quit()
  }
})

app.on('before-quit', () => {
  // 标记正在退出，让 close 事件不再阻止关闭
  isQuitting = true
  // Clean up system tray before quitting
  destroyTray()
})
