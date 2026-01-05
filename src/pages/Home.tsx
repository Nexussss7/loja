import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function Home() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeaturedProducts();
    }, []);

    const loadFeaturedProducts = async () => {
        try {
            // Fetch products that are active, prioritized by 'is_featured'
            // We map to match ProductCard expectation if needed, but Product structure is similar
            const { data, error } = await supabase
                .from('products')
                .select('*, images:product_images(image_url), category:categories(name)')
                .eq('is_active', true)
                .order('is_featured', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(8);

            if (error) throw error;

            const formattedProducts = data?.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                category: p.category?.name || 'Geral',
                image: p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop'
            }));

            setProducts(formattedProducts || []);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-zinc-50 dark:bg-black min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[80vh] w-full overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop"
                    alt="Hero Fashion"
                    className="absolute inset-0 w-full h-full object-cover brightness-75"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4 z-10">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-bold tracking-tighter mb-4"
                    >
                        WEBBER MOOD
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl md:text-2xl font-light tracking-wide max-w-lg mb-8"
                    >
                        Estilo é sobre sentir, é vestir.
                    </motion.p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-100 transition"
                    >
                        Ver Coleção
                    </motion.button>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Destaques</span>
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">Nova Coleção</h2>
                    </div>
                    <button className="hidden md:block text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition">
                        Ver tudo &rarr;
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                        Nenhum produto disponível no momento.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product as any} />
                        ))}
                    </div>
                )}

                <div className="mt-12 text-center md:hidden">
                    <button className="px-6 py-2 border border-zinc-300 dark:border-zinc-700 rounded-full">
                        Ver tudo
                    </button>
                </div>
            </section>

            {/* Categories / Banner */}
            <section className="py-10 px-4">
                <div className="bg-zinc-900 text-white rounded-3xl overflow-hidden relative h-96 flex items-center justify-center">
                    <img
                        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
                        alt="Banner"
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                    <div className="relative z-10 text-center">
                        <h3 className="text-3xl font-bold mb-4">Temporada de Inverno</h3>
                        <p className="mb-6 text-zinc-200">Peças exclusivas para você brilhar no frio.</p>
                        <button className="bg-white text-black px-6 py-2 rounded-full font-medium">
                            Explorar Agora
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
