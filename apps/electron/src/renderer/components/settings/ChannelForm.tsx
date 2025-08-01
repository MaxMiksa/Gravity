/**
 * ChannelForm - 渠道编辑表单
 *
 * 支持创建和编辑渠道，包含：
 * - 基本信息（名称、提供商、Base URL、API Key）
 * - 模型列表编辑
 * - 连接测试
 */

import * as React from 'react'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PROVIDER_DEFAULT_URLS,
  PROVIDER_LABELS,
} from '@proma/shared'
import type {
  Channel,
  ChannelCreateInput,
  ChannelModel,
  ChannelTestResult,
  ProviderType,
} from '@proma/shared'

interface ChannelFormProps {
  /** 编辑模式下传入已有渠道，创建模式传 null */
  channel: Channel | null
  onSaved: () => void
  onCancel: () => void
}

/** 所有可选提供商 */
const PROVIDER_OPTIONS: ProviderType[] = ['anthropic', 'openai', 'deepseek', 'google', 'custom']

export function ChannelForm({ channel, onSaved, onCancel }: ChannelFormProps): React.ReactElement {
  const isEdit = channel !== null

  // 表单状态
  const [name, setName] = React.useState(channel?.name ?? '')
  const [provider, setProvider] = React.useState<ProviderType>(channel?.provider ?? 'anthropic')
  const [baseUrl, setBaseUrl] = React.useState(channel?.baseUrl ?? PROVIDER_DEFAULT_URLS.anthropic)
  const [apiKey, setApiKey] = React.useState('')
  const [showApiKey, setShowApiKey] = React.useState(false)
  const [models, setModels] = React.useState<ChannelModel[]>(channel?.models ?? [])
  const [enabled, setEnabled] = React.useState(channel?.enabled ?? true)

  // 新模型输入
  const [newModelId, setNewModelId] = React.useState('')
  const [newModelName, setNewModelName] = React.useState('')

  // UI 状态
  const [saving, setSaving] = React.useState(false)
  const [testing, setTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<ChannelTestResult | null>(null)
  const [apiKeyLoaded, setApiKeyLoaded] = React.useState(false)

  // 编辑模式下加载明文 API Key
  React.useEffect(() => {
    if (isEdit && channel && !apiKeyLoaded) {
      window.electronAPI.decryptApiKey(channel.id).then((key) => {
        setApiKey(key)
        setApiKeyLoaded(true)
      }).catch((error) => {
        console.error('[渠道表单] 解密 API Key 失败:', error)
        setApiKeyLoaded(true)
      })
    }
  }, [isEdit, channel, apiKeyLoaded])

  // 切换提供商时自动更新 Base URL
  const handleProviderChange = (newProvider: ProviderType): void => {
    setProvider(newProvider)
    setBaseUrl(PROVIDER_DEFAULT_URLS[newProvider])
    setTestResult(null)
  }

  /** 添加模型 */
  const handleAddModel = (): void => {
    if (!newModelId.trim()) return

    const model: ChannelModel = {
      id: newModelId.trim(),
      name: newModelName.trim() || newModelId.trim(),
      enabled: true,
    }

    setModels((prev) => [...prev, model])
    setNewModelId('')
    setNewModelName('')
  }

  /** 删除模型 */
  const handleRemoveModel = (modelId: string): void => {
    setModels((prev) => prev.filter((m) => m.id !== modelId))
  }

  /** 切换模型启用状态 */
  const handleToggleModel = (modelId: string): void => {
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, enabled: !m.enabled } : m))
    )
  }

  /** 测试连接 */
  const handleTest = async (): Promise<void> => {
    if (!isEdit || !channel) return

    setTesting(true)
    setTestResult(null)

    try {
      // 先保存当前修改（确保测试使用最新数据）
      await saveChannel()
      const result = await window.electronAPI.testChannel(channel.id)
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, message: '测试请求失败' })
    } finally {
      setTesting(false)
    }
  }

  /** 保存渠道 */
  const saveChannel = async (): Promise<void> => {
    if (isEdit && channel) {
      await window.electronAPI.updateChannel(channel.id, {
        name,
        provider,
        baseUrl,
        apiKey: apiKey || undefined,
        models,
        enabled,
      })
    } else {
      const input: ChannelCreateInput = {
        name,
        provider,
        baseUrl,
        apiKey,
        models,
        enabled,
      }
      await window.electronAPI.createChannel(input)
    }
  }

  /** 提交表单 */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!name.trim() || !apiKey.trim()) return

    setSaving(true)
    try {
      await saveChannel()
      onSaved()
    } catch (error) {
      console.error('[渠道表单] 保存失败:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="text-lg font-medium text-foreground">
          {isEdit ? '编辑渠道' : '添加渠道'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 渠道名称 */}
        <FormField label="渠道名称">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如: My Anthropic"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            required
          />
        </FormField>

        {/* 提供商选择 */}
        <FormField label="提供商">
          <div className="flex flex-wrap gap-2">
            {PROVIDER_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleProviderChange(p)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm border transition-colors',
                  provider === p
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {PROVIDER_LABELS[p]}
              </button>
            ))}
          </div>
        </FormField>

        {/* Base URL */}
        <FormField label="Base URL">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </FormField>

        {/* API Key */}
        <FormField label="API Key">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isEdit ? '留空则不更新' : '输入 API Key'}
              className="w-full px-3 py-2 pr-10 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              required={!isEdit}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>

        {/* 启用状态 */}
        <FormField label="状态">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-input"
            />
            <span className="text-sm text-foreground">启用此渠道</span>
          </label>
        </FormField>

        {/* 模型列表 */}
        <FormField label="模型列表">
          <div className="space-y-2">
            {/* 已有模型 */}
            {models.map((model) => (
              <div
                key={model.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background"
              >
                <input
                  type="checkbox"
                  checked={model.enabled}
                  onChange={() => handleToggleModel(model.id)}
                  className="w-3.5 h-3.5 rounded border-input"
                />
                <span className="text-sm text-foreground flex-1">
                  {model.name}
                  {model.name !== model.id && (
                    <span className="text-muted-foreground ml-1">({model.id})</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveModel(model.id)}
                  className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* 添加新模型 */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                placeholder="模型 ID（如 gpt-4o）"
                className="flex-1 px-3 py-1.5 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddModel()
                  }
                }}
              />
              <input
                type="text"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="显示名称（可选）"
                className="flex-1 px-3 py-1.5 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddModel()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddModel}
                disabled={!newModelId.trim()}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </FormField>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !name.trim() || (!isEdit && !apiKey.trim())}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            <span>{isEdit ? '保存修改' : '创建渠道'}</span>
          </button>

          {/* 测试连接（仅编辑模式，因为需要先保存才能测试） */}
          {isEdit && (
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-input text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {testing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Zap size={14} />
              )}
              <span>测试连接</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            取消
          </button>

          {/* 测试结果 */}
          {testResult && (
            <div className={cn(
              'flex items-center gap-1.5 text-sm',
              testResult.success ? 'text-emerald-600' : 'text-destructive'
            )}>
              {testResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

// ===== 表单字段包装组件 =====

interface FormFieldProps {
  label: string
  children: React.ReactNode
}

function FormField({ label, children }: FormFieldProps): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}
