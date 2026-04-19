'use client';

import { useState } from 'react';
import { Upload, Loader2, Trash2, GripVertical } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { uploadInteriorPhotos, deletePortfolioPhoto, reorderInteriorPhotos } from '@/app/actions/portfolio-photos';
import toast from 'react-hot-toast';

export interface InteriorPhoto {
    id: string;
    url: string;
    position: number;
}

interface InteriorPhotosSectionProps {
    initialPhotos: InteriorPhoto[];
}

const MAX_PHOTOS = 12;

export function InteriorPhotosSection({ initialPhotos }: InteriorPhotosSectionProps) {
    const [photos, setPhotos] = useState<InteriorPhoto[]>(initialPhotos);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (photos.length + files.length > MAX_PHOTOS) {
            toast.error(`Максимум ${MAX_PHOTOS} фото интерьера. Сейчас: ${photos.length}.`);
            e.target.value = '';
            return;
        }

        setIsUploading(true);
        try {
            const fd = new FormData();
            for (const file of Array.from(files)) {
                fd.append('photos', file);
            }

            const result = await uploadInteriorPhotos(fd);
            if (result.success) {
                setPhotos((prev) => [...prev, ...result.photos]);
                toast.success(
                    result.photos.length === 1
                        ? 'Фото загружено'
                        : `${result.photos.length} фото загружено`
                );
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Ошибка загрузки фото');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (photoId: string) => {
        if (!window.confirm('Удалить это фото?')) return;

        setDeletingId(photoId);
        try {
            const result = await deletePortfolioPhoto(photoId);
            if (result.success) {
                setPhotos((prev) => prev.filter((p) => p.id !== photoId));
                toast.success('Фото удалено');
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Ошибка удаления');
        } finally {
            setDeletingId(null);
        }
    };

    const handleReorder = async (newOrder: InteriorPhoto[]) => {
        setPhotos(newOrder);

        const ids = newOrder.map((p) => p.id);
        const result = await reorderInteriorPhotos(ids);
        if (!result.success) {
            toast.error(result.error);
            setPhotos(initialPhotos);
        }
    };

    return (
        <div className="space-y-4">
            {photos.length > 0 ? (
                <Reorder.Group
                    axis="x"
                    values={photos}
                    onReorder={handleReorder}
                    className="flex flex-wrap gap-2"
                >
                    {photos.map((photo) => (
                        <Reorder.Item
                            key={photo.id}
                            value={photo}
                            whileDrag={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                            className="group relative aspect-square w-[calc(50%-4px)] cursor-grab overflow-hidden rounded-md border border-gray-300 bg-transparent sm:w-[calc(25%-6px)] active:cursor-grabbing"
                        >
                            <img
                                src={photo.url}
                                alt="Интерьер"
                                className="h-full w-full object-cover"
                                draggable={false}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="absolute left-1 top-1 rounded-full bg-white/80 p-1 opacity-0 transition-opacity group-hover:opacity-70">
                                <GripVertical className="h-3 w-3 text-gray-600" />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDelete(photo.id)}
                                disabled={deletingId === photo.id}
                                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
                                aria-label="Удалить фото"
                            >
                                {deletingId === photo.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3 w-3" />
                                )}
                            </button>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            ) : (
                <div className="border border-dashed border-gray-300 bg-transparent py-10 text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">Добавьте фото вашего интерьера</p>
                    <p className="mt-1 text-xs text-gray-400">
                        Покажите атмосферу вашего салона — до {MAX_PHOTOS} фото
                    </p>
                </div>
            )}

            <div className="flex items-center gap-3">
                <label
                    className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-transparent px-4 text-sm font-medium text-gray-700 transition-colors hover:border-gray-900 ${
                        isUploading || photos.length >= MAX_PHOTOS
                            ? 'cursor-not-allowed opacity-60'
                            : ''
                    }`}
                >
                    {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4" />
                    )}
                    Добавить фото
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={handleUpload}
                        disabled={isUploading || photos.length >= MAX_PHOTOS}
                    />
                </label>
                <span className="text-xs text-gray-400">
                    {photos.length}/{MAX_PHOTOS} фото
                </span>
            </div>
        </div>
    );
}
