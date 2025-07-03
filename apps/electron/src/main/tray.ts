import { Tray, Menu, nativeTheme, app, nativeImage } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

let tray: Tray | null = null

/**
 * Get the appropriate tray icon path based on system theme
 */
function getTrayIconPath(): string {
  const resourcesDir = join(__dirname, '../resources/proma-logos')

  // macOS uses template images that adapt to theme automatically
  // For now, we'll manually switch based on theme
  const isDarkMode = nativeTheme.shouldUseDarkColors

  if (process.platform === 'darwin') {
    // macOS: white icon for dark menu bar, black icon for light menu bar
    return isDarkMode
      ? join(resourcesDir, 'proma_logo_white.png')
      : join(resourcesDir, 'proma_logo_black.png')
  } else {
    // Windows/Linux: usually use dark icon
    return join(resourcesDir, 'proma_logo_black.png')
  }
}

/**
 * Update tray icon based on current theme
 */
function updateTrayIcon(): void {
  if (!tray) return

  const iconPath = getTrayIconPath()
  if (existsSync(iconPath)) {
    const image = nativeImage.createFromPath(iconPath)

    // macOS: mark as template image for better rendering
    if (process.platform === 'darwin') {
      image.setTemplateImage(true)
    }

    tray.setImage(image)
  }
}

/**
 * Create system tray icon with menu
 */
export function createTray(): Tray | null {
  const iconPath = getTrayIconPath()

  if (!existsSync(iconPath)) {
    console.warn('Tray icon not found at:', iconPath)
    return null
  }

  try {
    const image = nativeImage.createFromPath(iconPath)

    // macOS: mark as template image for automatic theme adaptation
    // Template images should be monochrome and use alpha channel for shape
    if (process.platform === 'darwin') {
      image.setTemplateImage(true)
      tray = new Tray(image)
    } else {
      tray = new Tray(image)
    }

    // Set tooltip
    tray.setToolTip('Proma')

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Proma',
        click: () => {
          // Show/focus the main window
          const windows = require('electron').BrowserWindow.getAllWindows()
          if (windows.length > 0) {
            const mainWindow = windows[0]
            if (mainWindow.isMinimized()) {
              mainWindow.restore()
            }
            mainWindow.show()
            mainWindow.focus()
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit Proma',
        click: () => {
          app.quit()
        }
      }
    ])

    tray.setContextMenu(contextMenu)

    // Click behavior (show/hide window)
    tray.on('click', () => {
      const windows = require('electron').BrowserWindow.getAllWindows()
      if (windows.length > 0) {
        const mainWindow = windows[0]
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    })

    // Listen for theme changes
    nativeTheme.on('updated', updateTrayIcon)

    console.log('System tray created')
    return tray
  } catch (error) {
    console.error('Failed to create system tray:', error)
    return null
  }
}

/**
 * Destroy the system tray
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

/**
 * Get the current tray instance
 */
export function getTray(): Tray | null {
  return tray
}
