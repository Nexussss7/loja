import { motion } from "framer-motion";
import { ShoppingBag, Heart } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
}

export function ProductCard({ product }: { product: Product }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-lg border border-zinc-100 dark:border-zinc-800"
        >
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={product.image}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-white text-black rounded-full shadow-xl hover:bg-zinc-100 transition"
                    >
                        <ShoppingBag size={20} />
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-white text-red-500 rounded-full shadow-xl hover:bg-zinc-100 transition"
                    >
                        <Heart size={20} />
                    </motion.button>
                </div>

                {/* Badge */}
                <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-white bg-black/50 backdrop-blur-sm rounded-md">
                        {product.category}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="font-medium text-lg text-zinc-900 dark:text-zinc-100 mb-1 truncate">
                    {product.name}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-semibold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                </p>
            </div>
        </motion.div>
    );
}
