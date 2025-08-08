/**
 * SettingsPanel - 设置面板
 *
 * 左侧导航 + 右侧 ScrollArea 内容区域。
 * 四个标签页：通用 / 渠道配置 / 外观 / 关于
 * 使用 Jotai atom 管理当前标签页状态。
 */

import * as React from 'react'
import { useAtom } from 'jotai'
import { cn } from '@/lib/utils'
import { Settings, Radio, Palette, Info } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { settingsTabAtom } from '@/atoms/settings-tab'
import type { SettingsTab } from '@/atoms/settings-tab'
import { ChannelSettings } from './ChannelSettings'
import { GeneralSettings } from './GeneralSettings'
import { AppearanceSettings } from './AppearanceSettings'
import { AboutSettings } from './AboutSettings'

/** 设置 Tab 定义 */
interface TabItem {
  id: SettingsTab
  label: string
  icon: React.ReactNode
}

const TABS: TabItem[] = [
  { id: 'general', label: '通用', icon: <Settings size={16} /> },
  { id: 'channels', label: '渠道配置', icon: <Radio size={16} /> },
  { id: 'appearance', label: '外观', icon: <Palette size={16} /> },
  { id: 'about', label: '关于', icon: <Info size={16} /> },
]

/** 根据标签页 id 渲染对应内容 */
function renderTabContent(tab: SettingsTab): React.ReactElement {
  switch (tab) {
    case 'general':
      return <GeneralSettings />
    case 'channels':
      return <ChannelSettings />
    case 'appearance':
      return <AppearanceSettings />
    case 'about':
      return <AboutSettings />
  }
}

export function SettingsPanel(): React.ReactElement {
  const [activeTab, setActiveTab] = useAtom(settingsTabAtom)

  return (
    <div className="flex h-full">
      {/* 左侧 Tab 导航 */}
      <div className="w-[180px] border-r border-border/50 pt-14 px-2">
        <h2 className="text-xs font-medium text-muted-foreground px-3 mb-2 uppercase tracking-wider">
          设置
        </h2>
        <nav className="flex flex-col gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 右侧内容区域 */}
      <ScrollArea className="flex-1 pt-14">
        <div className="max-w-3xl mx-auto px-6 pb-6">
          {renderTabContent(activeTab)}
        </div>
      </ScrollArea>
    </div>
  )
}
