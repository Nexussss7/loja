import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

// GET /api/settings - Obter configurações da loja
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .single();

    if (error) {
      // Se não existir configuração, retornar valores padrão
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          settings: {
            store_name: 'Webber Mood',
            store_description: 'Estilo é sobre sentir, é vestir.',
            contact_email: '',
            contact_phone: '',
            instagram_handle: '@webbermood_use',
            whatsapp_number: '',
            address: 'Petrópolis, RJ',
            shipping_info: 'Envio para todo o Brasil',
          },
        });
      }
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/settings - Atualizar configurações (requer autenticação)
export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const body = await request.json();

    const {
      store_name,
      store_description,
      contact_email,
      contact_phone,
      instagram_handle,
      whatsapp_number,
      address,
      shipping_info,
    } = body;

    const updateData: any = {};
    if (store_name !== undefined) updateData.store_name = store_name;
    if (store_description !== undefined) updateData.store_description = store_description;
    if (contact_email !== undefined) updateData.contact_email = contact_email;
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
    if (instagram_handle !== undefined) updateData.instagram_handle = instagram_handle;
    if (whatsapp_number !== undefined) updateData.whatsapp_number = whatsapp_number;
    if (address !== undefined) updateData.address = address;
    if (shipping_info !== undefined) updateData.shipping_info = shipping_info;

    // Tentar atualizar primeiro
    const { data: existingSettings } = await supabase
      .from('store_settings')
      .select('id')
      .single();

    let data, error;

    if (existingSettings) {
      // Atualizar
      const result = await supabase
        .from('store_settings')
        .update(updateData)
        .eq('id', existingSettings.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Criar
      const result = await supabase
        .from('store_settings')
        .insert(updateData)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
