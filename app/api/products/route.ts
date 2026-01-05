import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

// GET /api/products - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category_id', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (active !== null && active !== undefined) {
      query = query.eq('active', active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products - Criar produto (requer autenticação)
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();

    const { name, description, category_id, base_price, sku, stock_quantity, images, variants } = body;

    // Validação básica
    if (!name || !category_id || !base_price) {
      return NextResponse.json(
        { error: 'Name, category_id, and base_price are required' },
        { status: 400 }
      );
    }

    // Criar produto
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        description,
        category_id,
        base_price,
        sku,
        stock_quantity: stock_quantity || 0,
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    // Adicionar imagens se fornecidas
    if (images && images.length > 0) {
      const imageInserts = images.map((img: any, index: number) => ({
        product_id: product.id,
        image_url: img.url,
        alt_text: img.alt || name,
        display_order: index,
        is_primary: index === 0,
      }));

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (imagesError) {
        console.error('Error adding images:', imagesError);
      }
    }

    // Adicionar variantes se fornecidas
    if (variants && variants.length > 0) {
      const variantInserts = variants.map((variant: any) => ({
        product_id: product.id,
        name: variant.name,
        sku: variant.sku,
        price_adjustment: variant.price_adjustment || 0,
        stock_quantity: variant.stock_quantity || 0,
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantInserts);

      if (variantsError) {
        console.error('Error adding variants:', variantsError);
      }
    }

    // Buscar produto completo com relações
    const { data: fullProduct } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('id', product.id)
      .single();

    return NextResponse.json({ product: fullProduct }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
