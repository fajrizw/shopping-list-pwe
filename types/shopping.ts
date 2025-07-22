export interface ShoppingItem {
  id: number
  name: string
  quantity: number
  category: string
  completed: boolean
  created_at: string
}

export interface CreateItemRequest {
  name: string
  quantity?: number
  category?: string
}

export interface UpdateItemRequest {
  name?: string
  quantity?: number
  category?: string
  completed?: boolean
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
  message?: string
}

export interface ItemStats {
  total: number
  completed: number
  pending: number
  byCategory: Record<string, {
    total: number
    completed: number
    pending: number
  }>
}

export interface BulkCreateRequest {
  items: CreateItemRequest[]
}

export interface BulkUpdateRequest {
  updates: Array<{ id: number } & UpdateItemRequest>
}

export interface BulkDeleteRequest {
  ids: number[]
}

export type FilterType = 'all' | 'completed' | 'pending'