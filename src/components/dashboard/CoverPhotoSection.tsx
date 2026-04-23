'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, X, ImagePlus } from 'lucide-react';
import { uploadCoverPhoto, deleteCoverPhoto } from '@/app/actions/cover-photo';
import toast from 'react-hot-toast';

interface CoverPhotoSectionProps {
    initialCoverUrl: string | null;
}

export function CoverPhotoSection({ initialCoverUrl }: CoverPhotoSectionProps) {
    const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append('photo', files[0]);

            const result = await uploadCoverPhoto(fd);
            if (result.success) {
                setCoverUrl(result.url);
                toast.success('Обложка загружена и сохранена');
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Ошибка загрузки обложки');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteCoverPhoto();
            if (result.success) {
                setCoverUrl(null);
                toast.success('Обложка удалена');
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Ошибка удаления обложки');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-2">
                Обложка профиля
            </label>

            {coverUrl ? (
                <div className="space-y-2">
                    <div className="inline-block rounded-xl overflow-hidden border-2 border-dashed border-gray-300">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={coverUrl}
                            alt="Обложка"
                            className="block max-h-40 w-auto h-auto"
                        />
                    </div>
                    {/* Action buttons below the image */}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
                        >
                            {isUploading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Upload className="h-3 w-3" />
                            )}
                            Заменить
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm border border-gray-200 hover:bg-gray-50 hover:text-red-500 transition-colors disabled:opacity-60"
                            aria-label="Удалить обложку"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <X className="h-3.5 w-3.5" />
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-full h-40 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full h-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-60 cursor-pointer"
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ImagePlus className="h-4 w-4" />
                        )}
                        <span>{isUploading ? 'Загрузка…' : '+ Загрузить обложку'}</span>
                    </button>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUpload}
                className="hidden"
            />

            <span className="text-[10px] uppercase tracking-widest text-gray-400 block ml-1">
                Рекомендуемый размер: 1200×400px (горизонтальная), до 5 МБ
            </span>
        </div>
    );
}
