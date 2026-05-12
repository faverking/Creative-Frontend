// ai-sdk 只保留当前 MonoApp 已落地的共享 AI 能力：
// 请求客户端、admin compose 能力、流式状态管理，以及仍在应用侧消费的基础组件。
export { AiClient, createAiClient } from './api/client'
export type { AiClientOptions, AiRequester } from './api/client'
export { runAdminComposeTask, streamAdminComposeTask } from './api/admin-compose'
export type {
  AdminAiTask,
  AdminAiTone,
  AdminComposeRequest,
  AdminComposeSource,
  AdminComposeOptions,
  AdminComposeResponse,
  AdminComposeResult,
  AdminComposeUsage,
  AdminAiStreamEvent,
  RewriteTitleResult,
  SummaryResult,
  HighlightsResult,
  OutlineResult,
  ContentRewriteResult,
  FeatureFlagSuggestionResult,
  ImageSourceSuggestionResult
} from './api/admin-compose'

export { AiChatPanel } from './components/AiChatPanel'

export { useAiTaskRunner } from './composables/useAiTaskRunner'
export type { AiTaskRunnerStatus } from './composables/useAiTaskRunner'
