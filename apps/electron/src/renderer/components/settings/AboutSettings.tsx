/**
 * AboutSettings - 关于页面
 *
 * 显示应用版本号等基本信息。
 */

import * as React from 'react'
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
} from './primitives'

/** 从 package.json 构建时注入的版本号，开发时回退到默认值 */
const APP_VERSION = '0.1.7'

export function AboutSettings(): React.ReactElement {
  return (
    <SettingsSection
      title="关于 Proma"
      description="集成通用 AI Agent 的下一代人工智能软件"
    >
      <SettingsCard>
        <SettingsRow label="版本">
          <span className="text-sm text-muted-foreground font-mono">{APP_VERSION}</span>
        </SettingsRow>
        <SettingsRow label="运行时">
          <span className="text-sm text-muted-foreground">Electron + React</span>
        </SettingsRow>
        <SettingsRow
          label="开源协议"
          description="本项目遵循开源协议发布"
        >
          <span className="text-sm text-muted-foreground">MIT</span>
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>
  )
}
