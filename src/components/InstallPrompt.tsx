

import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        setIsIOS(
            /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        );

        setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

        // Show prompt after a delay if not installed
        const timer = setTimeout(() => {
            if (!isStandalone) {
                setShowPrompt(true);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    if (isStandalone || !showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
            >
                <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl text-white">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="font-bold text-lg">Instalar App</h3>
                            <p className="text-sm text-gray-300">
                                Adicione à tela inicial para a melhor experiência.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowPrompt(false)}
                            className="p-1 hover:bg-white/10 rounded-full transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {isIOS ? (
                        <div className="text-sm text-gray-300 space-y-2">
                            <div className="flex items-center gap-2">
                                1. Toque em <Share size={16} />
                            </div>
                            <div className="flex items-center gap-2">
                                2. Selecione <span className="font-bold">Adicionar à Tela de Início</span> <PlusSquare size={16} />
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                // Trigger native install prompt if captured (requires more setup) or just guide user
                                alert("Use o menu do navegador para instalar!")
                            }}
                            className="w-full py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition"
                        >
                            Instalar Agora
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
