import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'
import { ItemStats, ApiResponse } from '../../../types/shopping'


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ItemStats>>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ 
      error: `Method ${req.method} Not Allowed`, 
      success: false 
    })
  }

  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('completed, category')

    if (error) {
      return res.status(500).json({ 
        error: error.message, 
        success: false 
      })
    }

    // Calculate statistics
    const stats: ItemStats = {
      total: items.length,
      completed: items.filter(item => item.completed).length,
      pending: items.filter(item => !item.completed).length,
      byCategory: {}
    }

    // Count by category
    items.forEach(item => {
      if (!stats.byCategory[item.category]) {
        stats.byCategory[item.category] = {
          total: 0,
          completed: 0,
          pending: 0
        }
      }
      stats.byCategory[item.category].total++
      if (item.completed) {
        stats.byCategory[item.category].completed++
      } else {
        stats.byCategory[item.category].pending++
      }
    })

    res.status(200).json({ data: stats, success: true })
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error', 
      success: false 
    })
  }
}