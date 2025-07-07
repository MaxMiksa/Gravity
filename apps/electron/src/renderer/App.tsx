import * as React from 'react'
import { AppShell } from './components/app-shell/AppShell'
import type { AppShellContextType } from './contexts/AppShellContext'

export default function App(): React.ReactElement {
  // Placeholder context value
  const contextValue: AppShellContextType = {}

  return <AppShell contextValue={contextValue} />
}
