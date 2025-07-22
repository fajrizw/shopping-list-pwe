import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function testSupabaseConnection() {
  try {
    const { count, error } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }

    console.log('Supabase connected successfully. Row count:', count)
    return true
  } catch (_error) {
    console.error('Supabase connection failed:', _error)
    return false
  }
}
