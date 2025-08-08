/**
 * AppearanceSettings - 外观设置页
 *
 * 主题切换（浅色/深色/跟随系统），使用 SettingsSegmentedControl。
 * 当前为占位实现，后续可扩展自定义主题。
 */

import * as React from 'react'
import {
  SettingsSection,
  SettingsCard,
  SettingsSegmentedControl,
} from './primitives'

/** 主题模式类型 */
type ThemeMode = 'light' | 'dark' | 'system'

/** 主题选项 */
const THEME_OPTIONS = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
]

export function AppearanceSettings(): React.ReactElement {
  const [theme, setTheme] = React.useState<ThemeMode>('light')

  return (
    <SettingsSection
      title="外观设置"
      description="自定义应用的视觉风格"
    >
      <SettingsCard>
        <SettingsSegmentedControl
          label="主题模式"
          description="选择应用的配色方案"
          value={theme}
          onValueChange={(v) => setTheme(v as ThemeMode)}
          options={THEME_OPTIONS}
        />
      </SettingsCard>
    </SettingsSection>
  )
}
