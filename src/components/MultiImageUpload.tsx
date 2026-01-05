import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, ArrowLeft, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';

export interface UploadedImage {
  url: string;
  path: string;
  alt?: string;
}

interface MultiImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export default function MultiImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  maxSizeMB = 5,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      alert(`Você pode adicionar no máximo ${maxImages} imagens`);
      return;
    }

    setUploading(true);

    try {
      const newImages: UploadedImage[] = [];

      for (const file of files) {
        // Validation
        const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!acceptedTypes.includes(file.type)) {
          alert(`Tipo de arquivo inválido: ${file.name}`);
          continue;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
          alert(`Arquivo muito grande: ${file.name}`);
          continue;
        }

        // Upload to Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        newImages.push({
          url: publicUrl,
          path: filePath,
          alt: file.name
        });
      }

      onImagesChange([...images, ...newImages]);
    } catch (error) {
      console.error(error);
      alert('Erro ao fazer upload. Verifique sua conexão e permissões.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async (index: number) => {
    const imageToRemove = images[index];
    // Optional: Delete from storage immediately, or just remove from list and let cleanup happen later
    // For now, let's just remove from the list to avoid accidental deletion of shared images if logic changes

    // If you want to delete from bucket:
    /*
    const { error } = await supabase.storage.from('products').remove([imageToRemove.path]);
    if (error) console.error('Error deleting file:', error);
    */

    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Button */}
      <div>
        <label
          className={`
            relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors
            ${uploading
              ? 'border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800'
              : 'border-zinc-300 hover:border-pink-500 bg-white hover:bg-pink-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-pink-500 dark:hover:bg-zinc-800'
            }
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
              <span className="text-sm text-zinc-500 font-medium">Enviando imagens...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-zinc-400 mb-2" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Clique para fazer upload
              </span>
              <span className="text-xs text-zinc-500 mt-1">
                JPG, PNG ou WebP (Max {maxSizeMB}MB)
              </span>
            </div>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading || images.length >= maxImages}
            multiple
          />
        </label>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.path}
              className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700"
            >
              <img
                src={image.url}
                alt={image.alt || `Imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    className="p-1.5 bg-white text-zinc-900 rounded-full hover:bg-zinc-100 transition"
                    title="Mover para esquerda"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                  title="Remover"
                >
                  <X size={16} />
                </button>

                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    className="p-1.5 bg-white text-zinc-900 rounded-full hover:bg-zinc-100 transition"
                    title="Mover para direita"
                  >
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  #{index + 1}
                </span>
                {index === 0 && (
                  <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    Principal
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
