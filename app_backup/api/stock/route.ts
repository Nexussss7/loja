import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

// GET /api/stock - Listar movimentações de estoque
export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const productId = searchParams.get('product_id');
    const variantId = searchParams.get('variant_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        product:products(id, name),
        variant:product_variants(id, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (variantId) {
      query = query.eq('variant_id', variantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching stock movements:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ movements: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/stock - Registrar movimentação de estoque (requer autenticação)
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();

    const { product_id, variant_id, movement_type, quantity, notes } = body;

    // Validação
    if (!product_id || !movement_type || !quantity) {
      return NextResponse.json(
        { error: 'product_id, movement_type, and quantity are required' },
        { status: 400 }
      );
    }

    if (!['in', 'out', 'adjustment'].includes(movement_type)) {
      return NextResponse.json(
        { error: 'movement_type must be in, out, or adjustment' },
        { status: 400 }
      );
    }

    // Registrar movimentação
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id,
        variant_id,
        movement_type,
        quantity,
        notes,
      })
      .select()
      .single();

    if (movementError) {
      console.error('Error creating stock movement:', movementError);
      return NextResponse.json({ error: movementError.message }, { status: 500 });
    }

    // Atualizar estoque do produto ou variante
    const quantityChange = movement_type === 'out' ? -quantity : quantity;

    if (variant_id) {
      // Atualizar estoque da variante
      const { error: updateError } = await supabase.rpc('update_variant_stock', {
        p_variant_id: variant_id,
        p_quantity_change: quantityChange,
      });

      if (updateError) {
        console.error('Error updating variant stock:', updateError);
      }
    } else {
      // Atualizar estoque do produto
      const { error: updateError } = await supabase.rpc('update_product_stock', {
        p_product_id: product_id,
        p_quantity_change: quantityChange,
      });

      if (updateError) {
        console.error('Error updating product stock:', updateError);
      }
    }

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
