import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase'
import { ShoppingItem, CreateItemRequest, ApiResponse, FilterType } from '../../../types/shopping'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem[] | ShoppingItem>>
) {
  const { method } = req

  switch (method) {
    case 'GET':
      return await getItems(req, res)
    case 'POST':
      return await createItem(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ 
        error: `Method ${method} Not Allowed`, 
        success: false 
      })
  }
}

async function getItems(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem[]>>
) {
  try {
    const { filter } = req.query
    const filterType = filter as FilterType

    let query = supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (filterType === 'completed') {
      query = query.eq('completed', true)
    } else if (filterType === 'pending') {
      query = query.eq('completed', false)
    }

    const { data, error } = await query

    if (error) {
      return res.status(500).json({ 
        error: error.message, 
        success: false 
      })
    }

    res.status(200).json({ 
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

async function createItem(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem>>
) {
  try {
    const { name, quantity = 1, category = 'Other' }: CreateItemRequest = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        error: 'Name is required', 
        success: false 
      })
    }

    if (quantity < 1) {
      return res.status(400).json({ 
        error: 'Quantity must be at least 1', 
        success: false 
      })
    }

    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          name: name.trim(),
          quantity,
          category,
          completed: false
        }
      ])
      .select()

    if (error) {
      return res.status(500).json({ 
        error: error.message, 
        success: false 
      })
    }

    res.status(201).json({ 
      data: data[0] as ShoppingItem, 
      success: true 
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error', 
      success: false 
    })
  }
}