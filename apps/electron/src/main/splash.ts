import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

let splashWindow: BrowserWindow | null = null

/**
 * Creates and displays the splash screen window
 */
export function createSplashWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    x: Math.floor((width - 500) / 2),
    y: Math.floor((height - 300) / 2),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const splashPath = join(__dirname, '../resources/splash.html')
  splashWindow.loadFile(splashPath)

  // Prevent splash window from being garbage collected
  splashWindow.on('closed', () => {
    splashWindow = null
  })

  return splashWindow
}

/**
 * Closes the splash screen window with a fade-out effect
 */
export function closeSplashWindow(): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    // Fade out animation
    let opacity = 1.0
    const fadeInterval = setInterval(() => {
      opacity -= 0.1
      if (opacity <= 0) {
        clearInterval(fadeInterval)
        splashWindow?.close()
        splashWindow = null
      } else {
        splashWindow?.setOpacity(opacity)
      }
    }, 30)
  }
}

/**
 * Get the current splash window instance
 */
export function getSplashWindow(): BrowserWindow | null {
  return splashWindow
}
