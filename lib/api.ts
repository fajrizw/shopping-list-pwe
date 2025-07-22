import { 
  ShoppingItem, 
  CreateItemRequest, 
  UpdateItemRequest, 
  ItemStats, 
  ApiResponse, 
  FilterType 
} from '../types/shopping'

export const api = {
  async getItems(filter?: FilterType): Promise<ApiResponse<ShoppingItem[]>> {
    const url = filter ? `/api/items?filter=${filter}` : '/api/items'
    const response = await fetch(url)
    return response.json()
  },

  async getItem(id: number): Promise<ApiResponse<ShoppingItem>> {
    const response = await fetch(`/api/items/${id}`)
    return response.json()
  },

  async createItem(itemData: CreateItemRequest): Promise<ApiResponse<ShoppingItem>> {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    })
    return response.json()
  },

  async updateItem(id: number, updates: UpdateItemRequest): Promise<ApiResponse<ShoppingItem>> {
    const response = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    return response.json()
  },

  async deleteItem(id: number): Promise<ApiResponse<null>> {
    const response = await fetch(`/api/items/${id}`, {
      method: 'DELETE',
    })
    return response.json()
  },

  async getStats(): Promise<ApiResponse<ItemStats>> {
    const response = await fetch('/api/items/stats')
    return response.json()
  },

  async bulkCreate(items: CreateItemRequest[]): Promise<ApiResponse<ShoppingItem[]>> {
    const response = await fetch('/api/items/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    })
    return response.json()
  },

  async bulkUpdate(updates: Array<{ id: number } & UpdateItemRequest>): Promise<ApiResponse<ShoppingItem[]>> {
    const response = await fetch('/api/items/bulk', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    })
    return response.json()
  },

  async bulkDelete(ids: number[]): Promise<ApiResponse<{ deletedCount: number }>> {
    const response = await fetch('/api/items/bulk', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    })
    return response.json()
  }
}