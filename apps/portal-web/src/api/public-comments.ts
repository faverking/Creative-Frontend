import { getAppHttpClient } from '@frontend/app-runtime'

import { safeGetPublic, type ApiRequestResult, type PublicRequestQuery } from '@/api/public-request'

export type PublicCommentTargetType = 'article' | 'book' | 'image' | 'topic'

export interface PublicCommentAuthorResponse {
  userId: string
  name: string
  avatarUrl?: string
}

export interface PublicCommentMentionResponse {
  userId: string
  name: string
}

export interface PublicCommentReplyItemResponse {
  replyId: string
  content: string
  createdAt: string
  author: PublicCommentAuthorResponse
  mentionedUser?: PublicCommentMentionResponse
}

export interface PublicCommentThreadItemResponse {
  id: string
  targetType: PublicCommentTargetType
  targetId: string
  author: PublicCommentAuthorResponse
  content: string
  likeCount: number
  replyCount: number
  createdAt: string
  replies: PublicCommentReplyItemResponse[]
}

export interface PublicCommentThreadListResponse {
  targetType: PublicCommentTargetType
  targetId: string
  items: PublicCommentThreadItemResponse[]
  page: number
  limit: number
  total: number
}

export interface PublicCommentRepliesResponse {
  commentId: string
  targetType: PublicCommentTargetType
  targetId: string
  total: number
  replies: PublicCommentReplyItemResponse[]
}

export interface PublicCommentListQuery extends PublicRequestQuery {
  page?: number
  limit?: number
  replyLimit?: number
}

export interface PublicCommentRepliesQuery extends PublicRequestQuery {
  limit?: number
}

export interface PublicCreateCommentPayload {
  content: string
}

export interface PublicReplyCommentPayload {
  content: string
  mentionUserId?: string
}

export interface PublicReplyCommentResponse {
  commentId: string
  targetType: PublicCommentTargetType
  targetId: string
  replyCount: number
  latestReply: PublicCommentReplyItemResponse
  rootCommentAuthorUserId: string
  mentionedUserId?: string
  context: string
}

const COMMENT_TARGET_PATH_MAP: Record<PublicCommentTargetType, string> = {
  article: 'articles',
  book: 'books',
  image: 'images',
  topic: 'topics'
}

function normalizeText(value: string | undefined | null): string {
  return value?.trim() || ''
}

function resolveTargetCommentsPath(targetType: PublicCommentTargetType, targetId: string): string {
  const normalizedTargetId = normalizeText(targetId)

  if (!normalizedTargetId) {
    throw new Error('Target id is required for public comments.')
  }

  return `/${COMMENT_TARGET_PATH_MAP[targetType]}/${normalizedTargetId}/comments`
}

function resolveCommentRepliesPath(commentId: string): string {
  const normalizedCommentId = normalizeText(commentId)

  if (!normalizedCommentId) {
    throw new Error('Comment id is required for replies.')
  }

  return `/comments/${normalizedCommentId}/replies`
}

export const portalPublicCommentsApi = {
  getCommentThreads(
    targetType: PublicCommentTargetType,
    targetId: string,
    query: PublicCommentListQuery
  ): Promise<ApiRequestResult<PublicCommentThreadListResponse>> {
    return safeGetPublic<PublicCommentThreadListResponse>(
      resolveTargetCommentsPath(targetType, targetId),
      query
    )
  },

  getCommentReplies(
    commentId: string,
    query: PublicCommentRepliesQuery
  ): Promise<ApiRequestResult<PublicCommentRepliesResponse>> {
    return safeGetPublic<PublicCommentRepliesResponse>(resolveCommentRepliesPath(commentId), query)
  },

  createComment(
    targetType: PublicCommentTargetType,
    targetId: string,
    payload: PublicCreateCommentPayload
  ): Promise<PublicCommentThreadItemResponse> {
    return getAppHttpClient().post<PublicCommentThreadItemResponse, PublicCreateCommentPayload>(
      resolveTargetCommentsPath(targetType, targetId),
      {
        content: normalizeText(payload.content)
      }
    )
  },

  replyComment(
    commentId: string,
    payload: PublicReplyCommentPayload
  ): Promise<PublicReplyCommentResponse> {
    return getAppHttpClient().post<PublicReplyCommentResponse, PublicReplyCommentPayload>(
      resolveCommentRepliesPath(commentId),
      {
        content: normalizeText(payload.content),
        mentionUserId: normalizeText(payload.mentionUserId) || undefined
      }
    )
  }
}
