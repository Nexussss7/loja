'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MultiImageUpload from '@/components/MultiImageUpload';

interface Category {
  id: string;
  name: string;
}

interface ProductVariant {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock_quantity: number;
  price_adjustment: number;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Product data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  
  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    loadCategories();
    loadProduct();
  }, [productId]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadProduct = async () => {
    try {
      // Load product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(image_url, display_order),
          variants:product_variants(*)
        `)
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price.toString());
      setStockQuantity(product.stock_quantity.toString());
      setCategoryId(product.category_id);
      setSku(product.sku || '');
      setIsActive(product.is_active);
      
      // Sort images by display_order
      const sortedImages = (product.images || [])
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => img.image_url);
      setImages(sortedImages);

      // Load variants
      if (product.variants && product.variants.length > 0) {
        setHasVariants(true);
        setVariants(product.variants);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Erro ao carregar produto');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, {
      size: '',
      color: '',
      sku: '',
      stock_quantity: 0,
      price_adjustment: 0
    }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !price || !categoryId) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);

    try {
      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update({
          name,
          description,
          price: parseFloat(price),
          stock_quantity: parseInt(stockQuantity) || 0,
          category_id: categoryId,
          sku: sku || null,
          is_active: isActive
        })
        .eq('id', productId);

      if (productError) throw productError;

      // Update images - delete old ones and insert new ones
      await supabase.from('product_images').delete().eq('product_id', productId);
      
      if (images.length > 0) {
        const imageInserts = images.map((url, index) => ({
          product_id: productId,
          image_url: url,
          display_order: index,
          is_primary: index === 0
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageInserts);

        if (imagesError) throw imagesError;
      }

      // Update variants - delete old ones and insert new ones
      await supabase.from('product_variants').delete().eq('product_id', productId);
      
      if (hasVariants && variants.length > 0) {
        const variantInserts = variants.map(v => ({
          product_id: productId,
          size: v.size || null,
          color: v.color || null,
          sku: v.sku || null,
          stock_quantity: v.stock_quantity,
          price_adjustment: v.price_adjustment
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantInserts);

        if (variantsError) throw variantsError;
      }

      alert('Produto atualizado com sucesso!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar produto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Editar Produto</h1>
          <p className="text-gray-600 mt-1">Atualize as informações do produto</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: Vestido Floral Primavera"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Descreva o produto..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade em Estoque
                  </label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU (Código)
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Ex: VEST-001"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Produto ativo (visível no catálogo)
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Imagens do Produto</h2>
            <MultiImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />
          </div>

          {/* Variants */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Variantes</h2>
              <button
                type="button"
                onClick={() => setHasVariants(!hasVariants)}
                className="text-sm text-pink-600 hover:text-pink-700"
              >
                {hasVariants ? 'Remover variantes' : 'Adicionar variantes'}
              </button>
            </div>

            {hasVariants && (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">Variante {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Tamanho (ex: P, M, G)"
                        value={variant.size}
                        onChange={(e) => updateVariant(index, 'size', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Cor"
                        value={variant.color}
                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Estoque"
                        value={variant.stock_quantity}
                        onChange={(e) => updateVariant(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ajuste de preço (R$)"
                        value={variant.price_adjustment}
                        onChange={(e) => updateVariant(index, 'price_adjustment', parseFloat(e.target.value) || 0)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addVariant}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-pink-500 hover:text-pink-600 transition-colors"
                >
                  + Adicionar Variante
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
