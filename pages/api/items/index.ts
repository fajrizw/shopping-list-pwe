import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { ShoppingItem, CreateItemRequest, ApiResponse, FilterType } from '../../../types/shopping';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem[] | ShoppingItem>>
) {
  switch (req.method) {
    case 'GET':
      return getItems(req, res);
    case 'POST':
      return createItem(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        error: `Method ${req.method} Not Allowed`,
        success: false
      });
  }
}

async function getItems(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem[]>>
) {
  try {
    const filterType = req.query.filter as FilterType | undefined;

    let query = supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (filterType === 'completed') {
      query = query.eq('completed', true);
    } else if (filterType === 'pending') {
      query = query.eq('completed', false);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return res.status(200).json({
      data: data as ShoppingItem[],
      success: true
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Failed to fetch items',
      success: false
    });
  }
}

async function createItem(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ShoppingItem>>
) {
  try {
    const { name, quantity = 1, category = 'Other' }: CreateItemRequest = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'Name is required',
        success: false
      });
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({
        error: 'Quantity must be a number and at least 1',
        success: false
      });
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
      .single(); 

    if (error) throw new Error(error.message);

    return res.status(201).json({
      data,
      success: true
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Failed to create item',
      success: false
    });
  }
}
