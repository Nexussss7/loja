"use client";

import Image from "next/image";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";

const EXAMPLE_PRODUCTS = [
  {
    id: "1",
    name: "Vestido Midi Floral",
    price: 299.90,
    category: "Vestidos",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "2",
    name: "Blazer Alfaiataria",
    price: 459.00,
    category: "Casacos",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "3",
    name: "Calça Pantalona",
    price: 189.90,
    category: "Calças",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "4",
    name: "Camisa de Seda",
    price: 320.00,
    category: "Camisas",
    image: "https://images.unsplash.com/photo-1598532163257-5220c33d8376?q=80&w=1000&auto=format&fit=crop"
  }
];

export default function Home() {
  return (
    <div className="bg-zinc-50 dark:bg-black min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop"
          alt="Hero Fashion"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {EXAMPLE_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <button className="px-6 py-2 border border-zinc-300 dark:border-zinc-700 rounded-full">
            Ver tudo
          </button>
        </div>
      </section>

      {/* Categories / Banner */}
      <section className="py-10 px-4">
        <div className="bg-zinc-900 text-white rounded-3xl overflow-hidden relative h-96 flex items-center justify-center">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            alt="Banner"
            fill
            className="object-cover opacity-60"
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
