import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'
import type { ItemStats, ApiResponse } from '../../../types/shopping'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ItemStats>>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    })
  }

  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('completed, category')

    if (error || !items) {
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to fetch items'
      })
    }

    const stats: ItemStats = {
      total: items.length,
      completed: 0,
      pending: 0,
      byCategory: {}
    }

    for (const item of items) {
      const { completed, category } = item

      if (completed) stats.completed++
      else stats.pending++

      if (!stats.byCategory[category]) {
        stats.byCategory[category] = { total: 0, completed: 0, pending: 0 }
      }

      stats.byCategory[category].total++
      if (completed) {
        stats.byCategory[category].completed++
      } else {
        stats.byCategory[category].pending++
      }
    }

    return res.status(200).json({
      success: true,
      data: stats
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}
