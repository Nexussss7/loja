import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

// GET /api/products/[id] - Obter produto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      console.error('Error fetching product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/products/[id] - Atualizar produto (requer autenticação)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    const { name, description, category_id, base_price, sku, stock_quantity, active } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (sku !== undefined) updateData.sku = sku;
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Deletar produto (requer autenticação)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { id } = await params;

    // Soft delete - apenas marca como inativo
    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
