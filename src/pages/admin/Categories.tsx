import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, type Category } from '@/lib/supabase';
import { Plus, Edit, Trash2, Tag, X, Check, ArrowLeft } from 'lucide-react';

export default function Categories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setName(category.name);
            setDescription(category.description || '');
        } else {
            setEditingCategory(null);
            setName('');
            setDescription('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update({ name, slug, description, updated_at: new Date().toISOString() })
                    .eq('id', editingCategory.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([{ name, slug, description, display_order: categories.length + 1 }]);
                if (error) throw error;
            }

            await loadCategories();
            setIsModalOpen(false);
        } catch (error) {
            alert('Error saving category');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir esta categoria?')) return;
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            setCategories(categories.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir (verifique se há produtos associados)');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition">
                            <ArrowLeft className="text-zinc-600 dark:text-zinc-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Categorias</h1>
                            <p className="text-zinc-600 dark:text-zinc-400 mt-1">Organize seus produtos</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium shadow-lg shadow-purple-600/20"
                    >
                        <Plus size={20} />
                        Nova Categoria
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl text-purple-600 dark:text-purple-400">
                                        <Tag size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">{category.name}</h3>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">/{category.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(category)}
                                        className="p-2 text-zinc-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {categories.length === 0 && (
                            <div className="text-center py-20 text-zinc-500">
                                Nenhuma categoria encontrada.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Ex: Vestidos"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Descrição</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
                                    placeholder="Descrição opcional..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        'Salvando...'
                                    ) : (
                                        <>
                                            <Check size={18} />
                                            Salvar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
