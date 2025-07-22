import { NextApiRequest, NextApiResponse } from 'next'

import { supabase } from '../../../lib/supabase'
import { 
  ShoppingItem, 
  BulkCreateRequest, 
  BulkUpdateRequest, 
  BulkDeleteRequest, 
  ApiResponse 
} from '../../../types/shopping'


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem[] | { deletedCount: number }>>
) {
  const { method } = req

  switch (method) {
    case 'POST':
      return await bulkCreate(req, res)
    case 'PUT':
      return await bulkUpdate(req, res)
    case 'DELETE':
      return await bulkDelete(req, res)
    default:
      res.setHeader('Allow', ['POST', 'PUT', 'DELETE'])
      res.status(405).json({ 
        error: `Method ${method} Not Allowed`, 
        success: false 
      })
  }
}

async function bulkCreate(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem[]>>
) {
  try {
    const { items }: BulkCreateRequest = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Items array is required', 
        success: false 
      })
    }

    // Validate all items
    for (const item of items) {
      if (!item.name || item.name.trim() === '') {
        return res.status(400).json({ 
          error: 'All items must have a name', 
          success: false 
        })
      }
    }

    const itemsToInsert = items.map(item => ({
      name: item.name.trim(),
      quantity: item.quantity || 1,
      category: item.category || 'Other',
      completed: false
    }))

    const { data, error } = await supabase
      .from('items')
      .insert(itemsToInsert)
      .select()

    if (error) {
      return res.status(500).json({ 
        error: error.message, 
        success: false 
      })
    }

    res.status(201).json({ 
      data: data as ShoppingItem[], 
      success: true 
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error', 
      success: false 
    })
  }
}

async function bulkUpdate(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem[]>>
) {
  try {
    const { updates }: BulkUpdateRequest = req.body

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ 
        error: 'Updates array is required', 
        success: false 
      })
    }

    const results: ShoppingItem[] = []
    
    for (const update of updates) {
      if (!update.id) {
        return res.status(400).json({ 
          error: 'All updates must have an ID', 
          success: false 
        })
      }

      const { id, ...updateData } = update
      
      const { data, error } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', id)
        .select()

      if (error) {
        return res.status(500).json({ 
          error: error.message, 
          success: false 
        })
      }

      if (data.length > 0) {
        results.push(data[0] as ShoppingItem)
      }
    }

    res.status(200).json({ data: results, success: true })
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error', 
      success: false 
    })
  }
}

async function bulkDelete(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ deletedCount: number }>>
) {
  try {
    const { ids }: BulkDeleteRequest = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        error: 'IDs array is required', 
        success: false 
      })
    }

    const { data, error } = await supabase
      .from('items')
      .delete()
      .in('id', ids)
      .select()

    if (error) {
      return res.status(500).json({ 
        error: error.message, 
        success: false 
      })
    }

    res.status(200).json({ 
      data: { deletedCount: data.length },
      message: `${data.length} items deleted successfully`, 
      success: true 
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error', 
      success: false 
    })
  }
}

