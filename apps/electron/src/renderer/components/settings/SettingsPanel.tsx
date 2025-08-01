/**
 * SettingsPanel - 设置面板
 *
 * 左侧 tab 导航 + 右侧内容区域。
 * 首个 tab: "渠道配置"
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Radio } from 'lucide-react'
import { ChannelSettings } from './ChannelSettings'

/** 设置 Tab 定义 */
interface SettingsTab {
  id: string
  label: string
  icon: React.ReactNode
}

const TABS: SettingsTab[] = [
  { id: 'channels', label: '渠道配置', icon: <Radio size={16} /> },
]

export function SettingsPanel(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState('channels')

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
      <div className="flex-1 overflow-y-auto pt-14 px-6 pb-6">
        {activeTab === 'channels' && <ChannelSettings />}
      </div>
    </div>
  )
}
