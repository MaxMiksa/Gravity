/**
 * GeneralSettings - 通用设置页
 *
 * 占位页面，后续可扩展语言、快捷键等通用设置。
 */

import * as React from 'react'
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
} from './primitives'

export function GeneralSettings(): React.ReactElement {
  return (
    <SettingsSection
      title="通用设置"
      description="应用的基本配置"
    >
      <SettingsCard>
        <SettingsRow
          label="语言"
          description="更多语言支持即将推出"
        >
          <span className="text-sm text-muted-foreground">简体中文</span>
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>
  )
}
