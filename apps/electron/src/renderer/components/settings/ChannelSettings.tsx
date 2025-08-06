/**
 * ChannelSettings - 渠道配置页
 *
 * 渠道列表展示 + 添加/编辑/删除操作。
 * 通过 IPC 与主进程通信管理渠道数据。
 */

import * as React from 'react'
import { Plus, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROVIDER_LABELS } from '@proma/shared'
import type { Channel } from '@proma/shared'
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
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">渠道配置</h3>
          <p className="text-sm text-muted-foreground mt-1">
            管理 AI 供应商连接，配置 API Key 和可用模型
          </p>
        </div>
        <button
          onClick={() => setViewMode('create')}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          <span>添加渠道</span>
        </button>
      </div>

      {/* 渠道列表 */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">加载中...</div>
      ) : channels.length === 0 ? (
        <div className="text-sm text-muted-foreground py-12 text-center border border-dashed border-border rounded-lg">
          还没有配置任何渠道，点击上方"添加渠道"开始
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onEdit={() => {
                setEditingChannel(channel)
                setViewMode('edit')
              }}
              onDelete={() => handleDelete(channel)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ===== 渠道卡片子组件 =====

interface ChannelCardProps {
  channel: Channel
  onEdit: () => void
  onDelete: () => void
}

function ChannelCard({ channel, onEdit, onDelete }: ChannelCardProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/30 transition-colors">
      {/* 左侧信息 */}
      <div className="flex items-center gap-3">
        {/* 启用状态图标 */}
        <div className={cn(
          'flex-shrink-0',
          channel.enabled ? 'text-emerald-500' : 'text-muted-foreground'
        )}>
          {channel.enabled ? <Power size={18} /> : <PowerOff size={18} />}
        </div>

        <div>
          <div className="text-sm font-medium text-foreground">{channel.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {PROVIDER_LABELS[channel.provider]}
            {channel.models.length > 0 && (
              <span className="ml-2">
                {channel.models.filter((m) => m.enabled).length} 个模型已启用
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="编辑"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
