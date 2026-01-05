# CONFIGURAÇÃO DO SUPABASE - WEBBER MOOD PWA

## Passo 1: Criar Conta no Supabase

1. Acesse: https://supabase.com
2. Clique em "Comece seu projeto" ou "Start your project"
3. Faça login com GitHub, Google ou email

## Passo 2: Criar Novo Projeto

1. No dashboard, clique em "New Project"
2. Preencha as informações:
   - **Organization:** Crie uma nova ou selecione existente
   - **Project Name:** `webber-mood-pwa`
   - **Database Password:** Crie uma senha forte e GUARDE-A
   - **Region:** Selecione `South America (São Paulo)` para melhor performance no Brasil
   - **Pricing Plan:** Free (suficiente para começar)
3. Clique em "Create new project"
4. Aguarde 2-3 minutos para o projeto ser provisionado

## Passo 3: Executar o Schema SQL

1. No menu lateral, clique em **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `database/schema.sql`
4. Cole no editor SQL
5. Clique em "Run" ou pressione Ctrl+Enter
6. Verifique se todas as tabelas foram criadas com sucesso

## Passo 4: Obter Credenciais do Projeto

1. No menu lateral, clique em **Settings** (⚙️)
2. Clique em **API**
3. Copie as seguintes informações:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** Começa com `eyJhbGc...`
   - **service_role key:** Começa com `eyJhbGc...` (MANTENHA SECRETA!)

## Passo 5: Configurar Variáveis de Ambiente no Projeto

1. Na pasta do projeto `webber-mood-pwa`, crie um arquivo `.env.local`
2. Adicione as seguintes variáveis:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI (para geração de legendas com IA)
OPENAI_API_KEY=sk-...

# Ou use Google Gemini (alternativa gratuita)
GEMINI_API_KEY=AIza...
```

3. Substitua os valores `xxxxx` e `eyJhbGc...` pelas suas credenciais reais
4. **IMPORTANTE:** O arquivo `.env.local` já está no `.gitignore` e NÃO será commitado

## Passo 6: Instalar Cliente Supabase no Projeto

```bash
npm install @supabase/supabase-js
```

## Passo 7: Configurar Autenticação (Admin)

1. No Supabase, vá em **Authentication** > **Providers**
2. Habilite **Email** provider
3. Vá em **Authentication** > **Users**
4. Clique em "Add user" > "Create new user"
5. Adicione:
   - **Email:** seu-email@exemplo.com
   - **Password:** senha-forte-admin
   - **Auto Confirm User:** Marque esta opção
6. Clique em "Create user"

## Passo 8: Configurar Storage (Upload de Imagens)

1. No menu lateral, clique em **Storage**
2. Clique em "Create a new bucket"
3. Configure:
   - **Name:** `product-images`
   - **Public bucket:** Marque esta opção (para imagens serem acessíveis publicamente)
4. Clique em "Create bucket"
5. Clique no bucket criado
6. Vá em **Policies** e adicione uma política:
   - **Policy name:** `Public read access`
   - **Allowed operations:** SELECT
   - **Target roles:** public
   - **Policy definition:** `true`
7. Adicione outra política para upload (admin):
   - **Policy name:** `Authenticated users can upload`
   - **Allowed operations:** INSERT, UPDATE, DELETE
   - **Target roles:** authenticated
   - **Policy definition:** `true`

## Passo 9: Testar Conexão

Crie um arquivo de teste `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Teste a conexão
export async function testConnection() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
  
  if (error) {
    console.error('Erro ao conectar:', error)
    return false
  }
  
  console.log('Conexão bem-sucedida! Categorias:', data)
  return true
}
```

## Passo 10: Verificar Tabelas Criadas

No Supabase, vá em **Table Editor** e verifique se as seguintes tabelas existem:

- ✅ categories
- ✅ products
- ✅ product_images
- ✅ product_variants
- ✅ stock_movements
- ✅ store_settings

## Próximos Passos

Após configurar o Supabase:

1. Criar as API routes no Next.js
2. Implementar sistema de upload de imagens
3. Integrar IA para geração de legendas
4. Desenvolver interface administrativa
5. Criar catálogo público

## Recursos Úteis

- **Documentação Supabase:** https://supabase.com/docs
- **Supabase + Next.js:** https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **Dashboard do Projeto:** https://app.supabase.com/project/[seu-project-id]

## Troubleshooting

### Erro: "relation does not exist"
- Verifique se o schema SQL foi executado corretamente
- Vá em SQL Editor e execute novamente

### Erro: "Invalid API key"
- Verifique se copiou a chave correta (anon key para cliente)
- Verifique se o arquivo `.env.local` está na raiz do projeto
- Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro: "Row Level Security"
- Verifique se as policies foram criadas corretamente
- Para testes, pode temporariamente desabilitar RLS (não recomendado em produção)

## Custos

**Plano Free do Supabase inclui:**
- 500 MB de espaço no banco de dados
- 1 GB de armazenamento de arquivos
- 2 GB de transferência de dados
- 50.000 usuários ativos mensais

Isso é mais do que suficiente para começar!
