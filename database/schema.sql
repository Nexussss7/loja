-- WEBBER MOOD PWA - DATABASE SCHEMA
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  ai_generated_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Images Table
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Variants Table (sizes, colors)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(50),
  color VARCHAR(50),
  sku VARCHAR(100) UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Movements Table (for inventory tracking)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT'
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store Settings Table
CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_stock_movements_variant ON stock_movements(variant_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, slug, description, display_order) VALUES
  ('Vestidos', 'vestidos', 'Coleção de vestidos elegantes e modernos', 1),
  ('Blusas', 'blusas', 'Blusas e camisas para todos os estilos', 2),
  ('Calças', 'calcas', 'Calças e jeans confortáveis', 3),
  ('Saias', 'saias', 'Saias para todas as ocasiões', 4),
  ('Acessórios', 'acessorios', 'Bolsas, cintos e acessórios', 5);

-- Insert default store settings
INSERT INTO store_settings (key, value, description) VALUES
  ('store_name', 'Webber Mood', 'Nome da loja'),
  ('store_description', 'Estilo é sobre sentir, é vestir', 'Descrição da loja'),
  ('whatsapp_number', '5524999999999', 'Número do WhatsApp para contato'),
  ('instagram_handle', '@webbermood_use', 'Usuário do Instagram'),
  ('shipping_info', 'Envio para todo o Brasil', 'Informações de envio'),
  ('location', 'Petrópolis, RJ', 'Localização da loja');

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for active products and categories
CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view product images" ON product_images
  FOR SELECT USING (true);

CREATE POLICY "Public can view available variants" ON product_variants
  FOR SELECT USING (is_available = true);

CREATE POLICY "Public can view store settings" ON store_settings
  FOR SELECT USING (true);

-- Admin policies (authenticated users with admin role)
-- Note: You'll need to set up authentication and roles in Supabase
CREATE POLICY "Admins can do everything on categories" ON categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can do everything on products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can do everything on product_images" ON product_images
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can do everything on product_variants" ON product_variants
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can do everything on stock_movements" ON stock_movements
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can do everything on store_settings" ON store_settings
  FOR ALL USING (auth.role() = 'authenticated');
