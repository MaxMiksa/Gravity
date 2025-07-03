import { contextBridge } from 'electron'

/**
 * Preload script - Exposes safe APIs to the renderer process
 * This is a placeholder - APIs will be added as features are implemented
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder for future APIs
  // Example:
  // getAppVersion: () => ipcRenderer.invoke('get-app-version'),
})

// Type definition for the exposed API (for TypeScript in renderer)
export interface ElectronAPI {
  // Placeholder - methods will be added as needed
}

// Extend the Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
