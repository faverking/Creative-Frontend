import { HOME_CONTENT_LABELS, type HOME_CONTENT_TYPE } from './portal-business'
import type {
  WorkspaceProfileEditable as ApiWorkspaceProfileEditable,
  WorkspaceProfileResponse as ApiWorkspaceProfileResponse,
  WorkspaceProfileRole as ApiWorkspaceProfileRole,
  WorkspaceProfileStatus as ApiWorkspaceProfileStatus
} from '@/api/workspace'

export const PORTAL_WORKSPACE_ROOT_PATH = '/workspace'

export const PORTAL_WORKSPACE_ROUTE_NAMES = {
  root: 'workspace',
  messages: 'workspace-messages',
  favorites: 'workspace-favorites',
  history: 'workspace-history'
} as const

export const PORTAL_WORKSPACE_ROUTE_PATHS = {
  messages: 'messages',
  favorites: 'favorites',
  history: 'history'
} as const

export const PORTAL_WORKSPACE_SECTION_LABELS = {
  messages: '消息',
  favorites: '收藏',
  history: '历史'
} as const

export type PortalWorkspaceSection = keyof typeof PORTAL_WORKSPACE_ROUTE_PATHS
export type WorkspaceNavIconName = 'message' | 'favorite' | 'history'
export type WorkspaceMessageFilterKey = 'all' | 'comment' | 'reply' | 'unread'
export type WorkspaceContentFilterKey = 'all' | HOME_CONTENT_TYPE

export const PORTAL_WORKSPACE_DEFAULT_SECTION: PortalWorkspaceSection = 'messages'
export const WORKSPACE_DEFAULT_PAGE = 1
export const WORKSPACE_PAGE_SIZE = 20

export interface WorkspacePageOption {
  key: string
  label: string
  active?: boolean
}

export interface WorkspaceToolbarActionConfirm {
  title: string
  confirmButtonText?: string
  cancelButtonText?: string
}

export interface WorkspaceToolbarAction {
  key: string
  label: string
  tone?: 'default' | 'primary' | 'danger'
  disabled?: boolean
  loading?: boolean
  confirm?: WorkspaceToolbarActionConfirm
}

export type WorkspaceProfileRole = ApiWorkspaceProfileRole
export type WorkspaceProfileStatus = ApiWorkspaceProfileStatus

const WORKSPACE_CONTENT_FILTER_KEYS = Object.keys(HOME_CONTENT_LABELS) as HOME_CONTENT_TYPE[]

export const WORKSPACE_MESSAGE_FILTER_OPTIONS = [
  { key: 'all', label: '全部' },
  { key: 'comment', label: '评论' },
  { key: 'reply', label: '回复' },
  { key: 'unread', label: '未读' }
] as const satisfies ReadonlyArray<{
  key: WorkspaceMessageFilterKey
  label: string
}>

export const WORKSPACE_CONTENT_FILTER_OPTIONS = [
  { key: 'all', label: '全部' },
  ...WORKSPACE_CONTENT_FILTER_KEYS.map((key) => ({
    key,
    label: HOME_CONTENT_LABELS[key]
  }))
] satisfies ReadonlyArray<{
  key: WorkspaceContentFilterKey
  label: string
}>

export const WORKSPACE_PROFILE_ROLE_LABELS: Record<WorkspaceProfileRole, string> = {
  user: '普通用户',
  editor: '内容编辑',
  admin: '管理员',
  super_admin: '超级管理员'
}

export const WORKSPACE_PROFILE_STATUS_LABELS: Record<WorkspaceProfileStatus, string> = {
  active: '状态正常',
  blocked: '已封禁',
  deleted: '已注销'
}

export type WorkspaceProfile = ApiWorkspaceProfileResponse
export type WorkspaceProfileEditable = ApiWorkspaceProfileEditable

export interface WorkspaceNavItem {
  key: PortalWorkspaceSection
  label: string
  path: string
  routeName: (typeof PORTAL_WORKSPACE_ROUTE_NAMES)[PortalWorkspaceSection]
  iconName: WorkspaceNavIconName
}

const PORTAL_WORKSPACE_SECTION_ICONS: Record<PortalWorkspaceSection, WorkspaceNavIconName> = {
  messages: 'message',
  favorites: 'favorite',
  history: 'history'
}

export const PORTAL_WORKSPACE_SECTIONS = Object.keys(
  PORTAL_WORKSPACE_ROUTE_PATHS
) as PortalWorkspaceSection[]

export const PORTAL_WORKSPACE_NAV_ITEMS = PORTAL_WORKSPACE_SECTIONS.map((key) => ({
  key,
  label: PORTAL_WORKSPACE_SECTION_LABELS[key],
  path: PORTAL_WORKSPACE_ROUTE_PATHS[key],
  routeName: PORTAL_WORKSPACE_ROUTE_NAMES[key],
  iconName: PORTAL_WORKSPACE_SECTION_ICONS[key]
})) satisfies ReadonlyArray<WorkspaceNavItem>
