# Documentação da API - Webber Mood PWA

## Autenticação

A maioria dos endpoints requer autenticação. Use o Supabase Auth para fazer login.

## Endpoints

### Produtos

#### GET /api/products
Lista todos os produtos.

**Query Parameters:**
- `category` (opcional): Filtrar por ID da categoria
- `search` (opcional): Buscar por nome ou descrição
- `active` (opcional): Filtrar por status ativo (true/false)
- `limit` (opcional): Número de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Nome do Produto",
      "description": "Descrição",
      "category_id": "uuid",
      "base_price": 99.90,
      "sku": "SKU123",
      "stock_quantity": 10,
      "active": true,
      "category": { ... },
      "images": [ ... ],
      "variants": [ ... ]
    }
  ]
}
```

#### POST /api/products
Cria um novo produto. **Requer autenticação.**

**Body:**
```json
{
  "name": "Nome do Produto",
  "description": "Descrição",
  "category_id": "uuid",
  "base_price": 99.90,
  "sku": "SKU123",
  "stock_quantity": 10,
  "images": [
    {
      "url": "https://...",
      "alt": "Texto alternativo"
    }
  ],
  "variants": [
    {
      "name": "Tamanho P",
      "sku": "SKU123-P",
      "price_adjustment": 0,
      "stock_quantity": 5
    }
  ]
}
```

#### GET /api/products/[id]
Obtém um produto específico.

#### PUT /api/products/[id]
Atualiza um produto. **Requer autenticação.**

**Body:** Mesmos campos do POST (todos opcionais)

#### DELETE /api/products/[id]
Deleta (soft delete) um produto. **Requer autenticação.**

---

### Categorias

#### GET /api/categories
Lista todas as categorias.

**Query Parameters:**
- `active` (opcional): Filtrar por status ativo (true/false)

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Vestidos",
      "description": "Descrição",
      "slug": "vestidos",
      "active": true
    }
  ]
}
```

#### POST /api/categories
Cria uma nova categoria. **Requer autenticação.**

**Body:**
```json
{
  "name": "Vestidos",
  "description": "Descrição",
  "slug": "vestidos"
}
```

#### GET /api/categories/[id]
Obtém uma categoria específica.

#### PUT /api/categories/[id]
Atualiza uma categoria. **Requer autenticação.**

#### DELETE /api/categories/[id]
Deleta (soft delete) uma categoria. **Requer autenticação.**

---

### Upload de Imagens

#### POST /api/upload
Faz upload de uma imagem. **Requer autenticação.**

**Body:** FormData com campo `file`

**Response:**
```json
{
  "url": "https://...",
  "path": "products/123-abc.jpg",
  "fileName": "123-abc.jpg"
}
```

**Limitações:**
- Tipos permitidos: JPEG, PNG, WebP
- Tamanho máximo: 5MB

#### DELETE /api/upload?path=products/123-abc.jpg
Deleta uma imagem. **Requer autenticação.**

---

### Estoque

#### GET /api/stock
Lista movimentações de estoque. **Requer autenticação.**

**Query Parameters:**
- `product_id` (opcional): Filtrar por produto
- `variant_id` (opcional): Filtrar por variante
- `limit` (opcional): Número de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Response:**
```json
{
  "movements": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "variant_id": "uuid",
      "movement_type": "in",
      "quantity": 10,
      "notes": "Entrada de estoque",
      "created_at": "2026-01-04T..."
    }
  ]
}
```

#### POST /api/stock
Registra uma movimentação de estoque. **Requer autenticação.**

**Body:**
```json
{
  "product_id": "uuid",
  "variant_id": "uuid",
  "movement_type": "in",
  "quantity": 10,
  "notes": "Entrada de estoque"
}
```

**movement_type:** `in` (entrada), `out` (saída), `adjustment` (ajuste)

---

### Configurações da Loja

#### GET /api/settings
Obtém as configurações da loja.

**Response:**
```json
{
  "settings": {
    "store_name": "Webber Mood",
    "store_description": "Estilo é sobre sentir, é vestir.",
    "contact_email": "contato@webbermood.com",
    "contact_phone": "(24) 99999-9999",
    "instagram_handle": "@webbermood_use",
    "whatsapp_number": "5524999999999",
    "address": "Petrópolis, RJ",
    "shipping_info": "Envio para todo o Brasil"
  }
}
```

#### PUT /api/settings
Atualiza as configurações da loja. **Requer autenticação.**

**Body:** Mesmos campos do GET (todos opcionais)

---

### IA - Geração de Legendas

#### POST /api/ai/generate-caption
Gera uma legenda para Instagram usando IA. **Requer autenticação.**

**Body:**
```json
{
  "imageUrl": "https://...",
  "productName": "Vestido Floral",
  "category": "Vestidos",
  "style": "casual e moderno"
}
```

**Response:**
```json
{
  "caption": "\ud83c\udf38 Vestido Floral perfeito para os dias de ver\u00e3o! \u2728\n\nEstilo casual e moderno que voc\u00ea vai amar \ud83d\udc95\n\n#webbermood #moda #vestido #fashion #style"
}
```

**Nota:** Requer configuração da variável de ambiente `OPENAI_API_KEY`

---

## Variáveis de Ambiente Necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
OPENAI_API_KEY=sua_chave_openai (opcional, para geração de legendas)
```

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `404` - Não encontrado
- `500` - Erro interno do servidor

## Exemplos de Uso

### Criar um produto com imagem

```javascript
// 1. Upload da imagem
const formData = new FormData();
formData.append('file', imageFile);

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const { url } = await uploadResponse.json();

// 2. Criar produto
const productResponse = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Vestido Floral',
    description: 'Lindo vestido floral',
    category_id: 'uuid-da-categoria',
    base_price: 149.90,
    stock_quantity: 5,
    images: [
      {
        url: url,
        alt: 'Vestido Floral',
      },
    ],
  }),
});

const { product } = await productResponse.json();
```

### Registrar venda (saída de estoque)

```javascript
const response = await fetch('/api/stock', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product_id: 'uuid-do-produto',
    movement_type: 'out',
    quantity: 1,
    notes: 'Venda - Pedido #123',
  }),
});
```
