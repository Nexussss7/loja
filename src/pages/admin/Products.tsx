import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type Product } from '@/lib/supabase';
import { Plus, Search, Edit, Trash2, Package, ArrowLeft } from 'lucide-react';

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
          *,
          category:categories(name),
          variants:product_variants(*)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const productsWithStock = (data as any[])?.map(p => ({
                ...p,
                stock_quantity: p.variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0
            }));

            setProducts(productsWithStock);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert('Erro ao excluir produto');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition">
                            <ArrowLeft className="text-zinc-600 dark:text-zinc-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Produtos</h1>
                            <p className="text-zinc-600 dark:text-zinc-400 mt-1">Gerencie seu catálogo</p>
                        </div>
                    </div>
                    <Link
                        to="/admin/products/new"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition font-medium shadow-lg shadow-pink-600/20"
                    >
                        <Plus size={20} />
                        Novo Produto
                    </Link>
                </div>

                {/* Search */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar produtos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                        <Package className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-zinc-900 dark:text-white mb-2">Nenhum produto encontrado</h3>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            {searchTerm ? 'Tente buscar por outro termo' : 'Comece adicionando seu primeiro produto'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                                    <tr>
                                        <th className="p-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Produto</th>
                                        <th className="p-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Categoria</th>
                                        <th className="p-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Preço</th>
                                        <th className="p-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Estoque</th>
                                        <th className="p-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {filteredProducts.map((product: any) => (
                                        <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    {/* We created MultiImageUpload and ImageUpload, so we know how to construct image urls if needed, but for list let's keep simple */}
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="w-12 h-12 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                            <Package size={20} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-zinc-900 dark:text-white">{product.name}</p>
                                                        <p className="text-xs text-zinc-500">{product.variants?.length || 0} variações</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-zinc-600 dark:text-zinc-400">
                                                {product.category?.name || '-'}
                                            </td>
                                            <td className="p-6 font-medium text-zinc-900 dark:text-white">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${(product.stock_quantity || 0) <= 5
                                                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                    }`}>
                                                    {product.stock_quantity || 0} un
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/admin/products/${product.id}`}
                                                        className="p-2 text-zinc-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
