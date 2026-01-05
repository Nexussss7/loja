import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  ai_generated_description: string | null
  price: number
  compare_at_price: number | null
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ProductImage = {
  id: string
  product_id: string
  image_url: string
  alt_text: string | null
  display_order: number
  is_primary: boolean
  created_at: string
}

export type ProductVariant = {
  id: string
  product_id: string
  size: string | null
  color: string | null
  sku: string | null
  stock_quantity: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export type StockMovement = {
  id: string
  variant_id: string
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  notes: string | null
  created_at: string
}

export type StoreSetting = {
  id: string
  key: string
  value: string | null
  description: string | null
  updated_at: string
}
