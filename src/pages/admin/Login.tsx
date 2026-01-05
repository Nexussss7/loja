import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                navigate('/admin');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        setLoading(true);
        try {
            // Create user ramonrodrigo2708@gmail.com with password '123456'
            const { error } = await supabase.auth.signUp({
                email: 'ramonrodrigo2708@gmail.com',
                password: '123456',
            });
            if (error) throw error;
            alert('Usuário criado com sucesso! Verifique seu email para confirmar (ou desative a confirmação no Supabase).');
            // Autofill for convenience
            setEmail('ramonrodrigo2708@gmail.com');
            setPassword('123456');
        } catch (err) {
            alert('Erro ao criar usuário: ' + (err instanceof Error ? err.message : 'Desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden"
            >
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Webber Mood</h1>
                        <p className="text-zinc-500">Acesso Administrativo</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-100 text-red-600 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>

                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={handleCreateAdmin}
                                className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline"
                            >
                                Criar Admin "Ramon" (Temp)
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
