import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase, type Category, type ProductVariant } from '@/lib/supabase';
import { ArrowLeft, Save, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import MultiImageUpload, { type UploadedImage } from '@/components/MultiImageUpload';

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form Fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [comparePrice, setComparePrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isFeatured, setIsFeatured] = useState(false);

    // Images
    const [images, setImages] = useState<UploadedImage[]>([]);

    // Variants
    const [variants, setVariants] = useState<Partial<ProductVariant>[]>([
        { size: 'Único', color: '', stock_quantity: 0, is_available: true }
    ]);

    useEffect(() => {
        loadCategories();
        if (isEditing) {
            loadProduct(id);
        }
    }, [id]);

    const loadCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('name');
        setCategories(data || []);
    };

    const loadProduct = async (productId: string) => {
        setLoading(true);
        try {
            const { data: product, error } = await supabase
                .from('products')
                .select('*, variants:product_variants(*), images:product_images(*)')
                .eq('id', productId)
                .single();

            if (error) throw error;

            setName(product.name);
            setDescription(product.description || '');
            setPrice(product.price.toString());
            setComparePrice(product.compare_at_price?.toString() || '');
            setCategoryId(product.category_id || '');
            setIsActive(product.is_active);
            setIsFeatured(product.is_featured);

            // Load Variants
            if (product.variants && product.variants.length > 0) {
                setVariants(product.variants);
            }

            // Load Images
            // Note: We need to adapt the structure if your table differs from MultiImageUpload expectation
            // Assuming product_images table has image_url, id.
            if (product.images && product.images.length > 0) {
                const loadedImages = product.images
                    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                    .map((img: any) => ({
                        url: img.image_url,
                        path: img.image_url.split('/').pop() || '', // Mock path if not stored
                        alt: img.alt_text
                    }));
                setImages(loadedImages);
            }

        } catch (error) {
            console.error(error);
            alert('Erro ao carregar produto');
            navigate('/admin/products');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (!name) return alert('Digite o nome do produto primeiro');

        setGeneratingAI(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error('API Key do Gemini não encontrada');

            const prompt = `Escreva uma descrição atraente e vendedora para um produto de moda chamado "${name}". 
      Categoria: ${categories.find(c => c.id === categoryId)?.name || 'Moda'}.
      Use emojis, bullets e tom persuasivo. Em português do Brasil.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                setDescription(text);
            } else {
                throw new Error('Sem resposta da IA');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao gerar descrição: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const productData = {
                name,
                slug,
                description,
                price: parseFloat(price),
                compare_at_price: comparePrice ? parseFloat(comparePrice) : null,
                category_id: categoryId || null,
                is_active: isActive,
                is_featured: isFeatured,
                updated_at: new Date().toISOString()
            };

            let productId = id;

            if (isEditing) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select()
                    .single();
                if (error) throw error;
                productId = data.id;
            }

            // Handle Variants (Simple Replace Strategy for simplicity, or localized upsert)
            // For robustness: Delete all variants for this product and re-insert.
            if (productId) {
                // 1. Delete existing
                await supabase.from('product_variants').delete().eq('product_id', productId);

                // 2. Insert new
                const variantsToInsert = variants.map(v => ({
                    product_id: productId,
                    size: v.size,
                    color: v.color,
                    stock_quantity: typeof v.stock_quantity === 'string' ? parseInt(v.stock_quantity) : v.stock_quantity,
                    is_available: true
                }));

                if (variantsToInsert.length > 0) {
                    const { error: varError } = await supabase.from('product_variants').insert(variantsToInsert);
                    if (varError) throw varError;
                }

                // Handle Images
                // 1. Delete existing mappings
                await supabase.from('product_images').delete().eq('product_id', productId);

                // 2. Insert new mappings
                const imagesToInsert = images.map((img, index) => ({
                    product_id: productId,
                    image_url: img.url,
                    display_order: index,
                    is_primary: index === 0
                }));

                if (imagesToInsert.length > 0) {
                    const { error: imgError } = await supabase.from('product_images').insert(imagesToInsert);
                    if (imgError) throw imgError;
                }
            }

            navigate('/admin/products');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar produto');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-6 pb-20">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/products" className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition">
                            <ArrowLeft className="text-zinc-600 dark:text-zinc-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                                {isEditing ? 'Editar Produto' : 'Novo Produto'}
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition font-medium shadow-lg shadow-pink-600/20 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Salvar Produto
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Basic Info */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-4">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Informações Básicas</h2>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome do Produto</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                                    placeholder="Ex: Vestido Floral Midi"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateDescription}
                                        disabled={generatingAI}
                                        className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                                    >
                                        {generatingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        Gerar com IA
                                    </button>
                                </div>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none h-40 resize-none"
                                    placeholder="Descrição detalhada do produto..."
                                />
                            </div>
                        </div>

                        {/* Images */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Imagens do Produto</h2>
                            <MultiImageUpload
                                images={images}
                                onImagesChange={setImages}
                                maxImages={5}
                            />
                        </div>

                        {/* Variants */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Estoque e Variações</h2>
                                <button
                                    type="button"
                                    onClick={() => setVariants([...variants, { size: '', color: '', stock_quantity: 0, is_available: true }])}
                                    className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                                >
                                    <Plus size={16} /> Adicionar Variação
                                </button>
                            </div>

                            <div className="space-y-4">
                                {variants.map((variant, index) => (
                                    <div key={index} className="flex gap-4 items-start p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                        <div className="flex-1 grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs text-zinc-500 mb-1">Tamanho</label>
                                                <input
                                                    type="text"
                                                    value={variant.size || ''}
                                                    onChange={e => {
                                                        const newVariants = [...variants];
                                                        newVariants[index].size = e.target.value;
                                                        setVariants(newVariants);
                                                    }}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                                    placeholder="P, M, G..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-500 mb-1">Cor</label>
                                                <input
                                                    type="text"
                                                    value={variant.color || ''}
                                                    onChange={e => {
                                                        const newVariants = [...variants];
                                                        newVariants[index].color = e.target.value;
                                                        setVariants(newVariants);
                                                    }}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                                    placeholder="Azul, Vermelho..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-zinc-500 mb-1">Qtd.</label>
                                                <input
                                                    type="number"
                                                    value={variant.stock_quantity || 0}
                                                    onChange={e => {
                                                        const newVariants = [...variants];
                                                        newVariants[index].stock_quantity = parseInt(e.target.value);
                                                        setVariants(newVariants);
                                                    }}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                                            className="mt-6 p-2 text-zinc-400 hover:text-red-500"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-4">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Preço e Organização</h2>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Preço (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Preço "De" (Opcional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={comparePrice}
                                    onChange={e => setComparePrice(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Categoria</label>
                                <select
                                    value={categoryId}
                                    onChange={e => setCategoryId(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                                >
                                    <option value="">Selecione...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 space-y-3 border-t border-zinc-100 dark:border-zinc-800">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={e => setIsActive(e.target.checked)}
                                        className="w-5 h-5 rounded border-zinc-300 text-pink-600 focus:ring-pink-500"
                                    />
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Produto Ativo</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={e => setIsFeatured(e.target.checked)}
                                        className="w-5 h-5 rounded border-zinc-300 text-pink-600 focus:ring-pink-500"
                                    />
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Destaque</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
