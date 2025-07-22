import type { NextApiRequest, NextApiResponse } from 'next';

import { supabase } from '../../../lib/supabase'
import { ShoppingItem, UpdateItemRequest, ApiResponse } from '../../../types/shopping'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem | null>>
) {
  const { method, query: { id } } = req

  if (!id || isNaN(parseInt(id as string))) {
    return res.status(400).json({ 
      error: 'Valid ID is required', 
      success: false 
    })
  }

  const itemId = parseInt(id as string)

  switch (method) {
    case 'GET':
      return await getItem(req, res, itemId)
    case 'PUT':
      return await updateItem(req, res, itemId)
    case 'DELETE':
      return await deleteItem(req, res, itemId)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      res.status(405).json({ 
        error: `Method ${method} Not Allowed`, 
        success: false 
      })
  }
}

async function getItem(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem>>,
  id: number
) {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Item not found', 
          success: false 
        })
      }
      return res.status(500).json({ 
        error: error.message, 
        success: false 
      })
    }

    res.status(200).json({ 
      data: data as ShoppingItem, 
      success: true 
    })
  } catch {
    res.status(500).json({ 
      error: 'Internal server error', 
      success: false 
    })
  }
}

async function updateItem(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem>>,
  id: number
) {
  try {
    const { name, quantity, category, completed }: UpdateItemRequest = req.body

    const updateData: Partial<ShoppingItem> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (quantity !== undefined) updateData.quantity = quantity
    if (category !== undefined) updateData.category = category
    if (completed !== undefined) updateData.completed = completed

    if (updateData.name === '') {
      return res.status(400).json({ 
        error: 'Name cannot be empty', 
        success: false 
      })
    }
    if (updateData.quantity && updateData.quantity < 1) {
      return res.status(400).json({ 
        error: 'Quantity must be at least 1', 
        success: false 
      })
    }

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

    if (data.length === 0) {
      return res.status(404).json({ 
        error: 'Item not found', 
        success: false 
      })
    }

    res.status(200).json({ 
      data: data[0] as ShoppingItem, 
      success: true 
    })
  } catch {
    res.status(500).json({ 
      error: 'Internal server error', 
      success: false 
    })
  }
}

async function deleteItem(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<null>>,
  id: number
) {
  try {
    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      return res.status(500).json({ 
        error: error.message, 
        success: false 
      })
    }

    if (data.length === 0) {
      return res.status(404).json({ 
        error: 'Item not found', 
        success: false 
      })
    }

    res.status(200).json({ 
      message: 'Item deleted successfully', 
      success: true 
    })
  } catch {
    res.status(500).json({ 
      error: 'Internal server error', 
      success: false 
    })
  }
}