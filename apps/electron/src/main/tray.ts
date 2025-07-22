import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

let tray: Tray | null = null

/**
 * 获取托盘图标路径
 * 所有平台统一使用 Template 图标
 */
function getTrayIconPath(): string {
  const resourcesDir = join(__dirname, '../resources/proma-logos')
  // 使用 Template 图标：
  // - macOS: 系统自动根据 DPI 选择 @1x/@2x/@3x，并根据菜单栏主题调整颜色
  // - Windows/Linux: 直接使用白色图标
  return join(resourcesDir, 'iconTemplate.png')
}

/**
 * 创建系统托盘图标和菜单
 */
export function createTray(): Tray | null {
  const iconPath = getTrayIconPath()

  if (!existsSync(iconPath)) {
    console.warn('托盘图标未找到:', iconPath)
    return null
  }

  try {
    const image = nativeImage.createFromPath(iconPath)

    // macOS: 标记为 Template 图像
    // Template 图像必须是单色的，使用 alpha 通道定义形状
    // 系统会自动根据菜单栏主题填充颜色
    if (process.platform === 'darwin') {
      image.setTemplateImage(true)
    }

    tray = new Tray(image)

    // 设置 tooltip
    tray.setToolTip('Proma')

    // 创建右键菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示 Proma',
        click: () => {
          // 显示/聚焦主窗口
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
        label: '退出 Proma',
        click: () => {
          app.quit()
        }
      }
    ])

    tray.setContextMenu(contextMenu)

    // 点击行为：显示/隐藏窗口
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

    console.log('系统托盘已创建')
    return tray
  } catch (error) {
    console.error('创建系统托盘失败:', error)
    return null
  }
}

/**
 * 销毁系统托盘
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

/**
 * 获取当前托盘实例
 */
export function getTray(): Tray | null {
  return tray
}
