/**
 * ChannelSettings - 渠道配置页
 *
 * 渠道列表展示 + 添加/编辑/删除操作。
 * 通过 IPC 与主进程通信管理渠道数据。
 */

import * as React from 'react'
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PROVIDER_LABELS } from '@proma/shared'
import type { Channel } from '@proma/shared'
import { SettingsSection, SettingsCard, SettingsRow } from './primitives'
import { ChannelForm } from './ChannelForm'

/** 组件视图模式 */
type ViewMode = 'list' | 'create' | 'edit'

export function ChannelSettings(): React.ReactElement {
  const [channels, setChannels] = React.useState<Channel[]>([])
  const [viewMode, setViewMode] = React.useState<ViewMode>('list')
  const [editingChannel, setEditingChannel] = React.useState<Channel | null>(null)
  const [loading, setLoading] = React.useState(true)

  /** 加载渠道列表 */
  const loadChannels = React.useCallback(async () => {
    try {
      const list = await window.electronAPI.listChannels()
      setChannels(list)
    } catch (error) {
      console.error('[渠道设置] 加载渠道列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadChannels()
  }, [loadChannels])

  /** 删除渠道 */
  const handleDelete = async (channel: Channel): Promise<void> => {
    if (!confirm(`确定删除渠道「${channel.name}」？此操作不可恢复。`)) return

    try {
      await window.electronAPI.deleteChannel(channel.id)
      await loadChannels()
    } catch (error) {
      console.error('[渠道设置] 删除渠道失败:', error)
    }
  }

  /** 表单保存回调 */
  const handleFormSaved = (): void => {
    setViewMode('list')
    setEditingChannel(null)
    loadChannels()
  }

  /** 取消表单 */
  const handleFormCancel = (): void => {
    setViewMode('list')
    setEditingChannel(null)
  }

  // 表单视图
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <ChannelForm
        channel={editingChannel}
        onSaved={handleFormSaved}
        onCancel={handleFormCancel}
      />
    )
  }

  // 列表视图
  return (
    <SettingsSection
      title="渠道配置"
      description="管理 AI 供应商连接，配置 API Key 和可用模型"
      action={
        <Button size="sm" onClick={() => setViewMode('create')}>
          <Plus size={16} />
          <span>添加渠道</span>
        </Button>
      }
    >
      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">加载中...</div>
      ) : channels.length === 0 ? (
        <SettingsCard divided={false}>
          <div className="text-sm text-muted-foreground py-12 text-center">
            还没有配置任何渠道，点击上方"添加渠道"开始
          </div>
        </SettingsCard>
      ) : (
        <SettingsCard>
          {channels.map((channel) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              onEdit={() => {
                setEditingChannel(channel)
                setViewMode('edit')
              }}
              onDelete={() => handleDelete(channel)}
            />
          ))}
        </SettingsCard>
      )}
    </SettingsSection>
  )
}

// ===== 渠道行子组件 =====

interface ChannelRowProps {
  channel: Channel
  onEdit: () => void
  onDelete: () => void
}

function ChannelRow({ channel, onEdit, onDelete }: ChannelRowProps): React.ReactElement {
  const enabledCount = channel.models.filter((m) => m.enabled).length
  const description = [
    PROVIDER_LABELS[channel.provider],
    enabledCount > 0 ? `${enabledCount} 个模型已启用` : undefined,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <SettingsRow
      label={channel.name}
      description={description}
      className="group"
    >
      <div className="flex items-center gap-2">
        {/* 启用状态标识 */}
        <div
          className={cn(
            'flex-shrink-0',
            channel.enabled ? 'text-emerald-500' : 'text-muted-foreground'
          )}
        >
          {channel.enabled ? <Power size={16} /> : <PowerOff size={16} />}
        </div>

        {/* 操作按钮 */}
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100"
          title="编辑"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
          title="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </SettingsRow>
  )
}
