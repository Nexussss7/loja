'use client';

import { useState } from 'react';
import Image from 'next/image';

interface UploadedImage {
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
      const uploadPromises = files.map(async (file) => {
        // Validar tipo
        const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!acceptedTypes.includes(file.type)) {
          throw new Error(`Tipo de arquivo inválido: ${file.name}`);
        }

        // Validar tamanho
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          throw new Error(`Arquivo muito grande: ${file.name}`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao fazer upload');
        }

        const data = await response.json();
        return {
          url: data.url,
          path: data.path,
          alt: file.name,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedImages]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao fazer upload: ${errorMessage}`);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemove = async (index: number) => {
    const imageToRemove = images[index];

    try {
      const response = await fetch(
        `/api/upload?path=${encodeURIComponent(imageToRemove.path)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao deletar imagem');
      }

      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    } catch (error) {
      alert('Erro ao deletar imagem');
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        {/* Upload Button */}
        <div>
          <label
            htmlFor="multi-file-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Adicionar Imagens ({images.length}/{maxImages})
              </>
            )}
          </label>
          <input
            id="multi-file-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading || images.length >= maxImages}
            multiple
          />
        </div>

        {/* Images Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.path}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
              >
                <Image
                  src={image.url}
                  alt={image.alt || `Imagem ${index + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Overlay com controles */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                  {/* Mover para esquerda */}
                  {index > 0 && (
                    <button
                      onClick={() => moveImage(index, index - 1)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Mover para esquerda"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                  )}

                  {/* Remover */}
                  <button
                    onClick={() => handleRemove(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    title="Remover"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>

                  {/* Mover para direita */}
                  {index < images.length - 1 && (
                    <button
                      onClick={() => moveImage(index, index + 1)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Mover para direita"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Badge de ordem */}
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {index + 1}
                </div>

                {/* Badge de principal */}
                {index === 0 && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <p className="text-sm text-gray-500">
          Formatos aceitos: JPEG, PNG, WebP. Tamanho máximo: {maxSizeMB}MB por imagem.
          {images.length > 0 && ' A primeira imagem será a principal.'}
        </p>
      </div>
    </div>
  );
}
