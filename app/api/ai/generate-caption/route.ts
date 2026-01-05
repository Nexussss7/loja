import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

// POST /api/ai/generate-caption - Gerar legenda com IA (requer autenticação)
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, productName, category, style } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // Aqui você pode integrar com OpenAI GPT-4 Vision ou Google Gemini
    // Por enquanto, vou criar um exemplo com OpenAI
    
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Criar prompt baseado nas informações fornecidas
    let prompt = 'Analise esta imagem de produto de moda e crie uma legenda atraente para Instagram. ';
    
    if (productName) {
      prompt += `O produto é: ${productName}. `;
    }
    
    if (category) {
      prompt += `Categoria: ${category}. `;
    }
    
    if (style) {
      prompt += `Estilo desejado: ${style}. `;
    }
    
    prompt += 'A legenda deve ser em português, criativa, usar emojis relevantes e incluir hashtags apropriadas para moda. Mantenha um tom moderno e atraente.';

    // Chamar OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate caption' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const caption = data.choices[0]?.message?.content || '';

    return NextResponse.json({ caption });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
