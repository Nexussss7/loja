import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type Product } from '@/lib/supabase';
import { Plus, Package, Eye, PackageOpen, Tag, AlertTriangle, DollarSign } from 'lucide-react';

interface DashboardStats {
    totalProducts: number;
    activeProducts: number;
    totalCategories: number;
    lowStockProducts: number;
    totalValue: number;
}

interface RecentProduct {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
    created_at: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        activeProducts: 0,
        totalCategories: 0,
        lowStockProducts: 0,
        totalValue: 0
    });
    const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load products
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('*, variants:product_variants(*)');

            const products = (productsData as any[])?.map(p => ({
                ...p,
                stock_quantity: p.variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0
            })) as Product[];

            if (productsError) throw productsError;

            // Load categories
            const { data: categories, error: categoriesError } = await supabase
                .from('categories')
                .select('id')
                .eq('is_active', true);

            if (categoriesError) throw categoriesError;

            // Load recent products
            const { data: recent, error: recentError } = await supabase
                .from('products')
                .select('id, name, price, created_at, variants:product_variants(stock_quantity)')
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentError) throw recentError;

            // Calculate stats
            const activeProducts = products?.filter(p => p.is_active) || [];
            const lowStockProducts = products?.filter(p => (p.stock_quantity || 0) <= 5) || [];
            const totalValue = products?.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0) || 0;

            setStats({
                totalProducts: products?.length || 0,
                activeProducts: activeProducts.length,
                totalCategories: categories?.length || 0,
                lowStockProducts: lowStockProducts.length,
                totalValue
            });

            setRecentProducts(recent?.map((p: any) => ({
                ...p,
                stock_quantity: p.variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0
            })) || []);
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
                    <p className="mt-4 text-zinc-600 dark:text-zinc-400">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-1">Visão geral do seu negócio</p>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/" className="text-sm font-medium text-pink-600 hover:text-pink-500">
                            Ir para Loja
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Products */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Produtos</p>
                                <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{stats.totalProducts}</p>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                                <PackageOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4">
                            {stats.activeProducts} ativos
                        </p>
                    </div>

                    {/* Categories */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Categorias</p>
                                <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{stats.totalCategories}</p>
                            </div>
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                                <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4">
                            Ativas no catálogo
                        </p>
                    </div>

                    {/* Low Stock */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Estoque Baixo</p>
                                <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{stats.lowStockProducts}</p>
                            </div>
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4">
                            ≤ 5 unidades
                        </p>
                    </div>

                    {/* Total Value */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Valor Total</p>
                                <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.totalValue)}
                                </p>
                            </div>
                            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4">
                            Em estoque
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Products */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Recentes</h2>
                            <Link
                                to="/admin/products"
                                className="text-sm text-pink-600 hover:text-pink-500 font-medium"
                            >
                                Ver todos
                            </Link>
                        </div>

                        {recentProducts.length === 0 ? (
                            <div className="text-center py-10">
                                <Package className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                                <p className="text-zinc-500 dark:text-zinc-400">Nenhum produto cadastrado</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentProducts.map(product => (
                                    <div key={product.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-zinc-900 dark:text-white">{product.name}</h3>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                Estoque: {product.stock_quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-pink-600">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                                {new Date(product.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Ações Rápidas</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <Link
                                to="/admin/products/new"
                                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl hover:from-pink-100 hover:to-pink-200 dark:hover:from-pink-900/30 dark:hover:to-pink-800/30 transition-all group border border-pink-100 dark:border-pink-900/30"
                            >
                                <div className="bg-pink-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-pink-600/20">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-sm font-medium text-zinc-900 dark:text-white">Novo Produto</span>
                            </Link>

                            <Link
                                to="/admin/categories"
                                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 transition-all group border border-purple-100 dark:border-purple-900/30"
                            >
                                <div className="bg-purple-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-purple-600/20">
                                    <Tag className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-sm font-medium text-zinc-900 dark:text-white">Categorias</span>
                            </Link>

                            <Link
                                to="/admin/products"
                                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all group border border-blue-100 dark:border-blue-900/30"
                            >
                                <div className="bg-blue-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/20">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-sm font-medium text-zinc-900 dark:text-white">Produtos</span>
                            </Link>

                            <Link
                                to="/"
                                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all group border border-green-100 dark:border-green-900/30"
                            >
                                <div className="bg-green-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-green-600/20">
                                    <Eye className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-sm font-medium text-zinc-900 dark:text-white">Ver Loja</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
