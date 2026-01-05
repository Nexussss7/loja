'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, type Product } from '@/lib/supabase';

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
      // Use logical OR to ensure stock_quantity is treated as number if undefined (though map ensures it)
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1">Visão geral da loja Webber Mood</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Products */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {stats.activeProducts} ativos
            </p>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categorias</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCategories}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Ativas no catálogo
            </p>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.lowStockProducts}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ≤ 5 unidades
            </p>
          </div>

          {/* Total Value */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor em Estoque</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  R$ {stats.totalValue.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Valor total do inventário
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Produtos Recentes</h2>
              <Link
                href="/admin/products"
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                Ver todos →
              </Link>
            </div>

            {recentProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum produto cadastrado</p>
            ) : (
              <div className="space-y-3">
                {recentProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        Estoque: {product.stock_quantity} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pink-600">R$ {product.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(product.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>

            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/admin/products/new"
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg hover:from-pink-100 hover:to-pink-200 transition-all group"
              >
                <div className="bg-pink-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Novo Produto</span>
              </Link>

              <Link
                href="/admin/categories"
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all group"
              >
                <div className="bg-purple-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Categorias</span>
              </Link>

              <Link
                href="/admin/products"
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all group"
              >
                <div className="bg-blue-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Produtos</span>
              </Link>

              <Link
                href="/catalog"
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all group"
              >
                <div className="bg-green-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Ver Catálogo</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">🚀 Bem-vindo ao Webber Mood PWA!</h3>
            <p className="text-pink-100">
              Sistema completo de gerenciamento de produtos com upload de imagens,
              integração com IA para gerar legendas, controle de estoque e catálogo online.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-pink-500">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">💡 Próximos Passos</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-pink-600 mr-2">•</span>
                Configure o Supabase seguindo o guia SETUP_SUPABASE.md
              </li>
              <li className="flex items-start">
                <span className="text-pink-600 mr-2">•</span>
                Adicione suas primeiras categorias
              </li>
              <li className="flex items-start">
                <span className="text-pink-600 mr-2">•</span>
                Cadastre produtos com imagens
              </li>
              <li className="flex items-start">
                <span className="text-pink-600 mr-2">•</span>
                Teste o catálogo público
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
