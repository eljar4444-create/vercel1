'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadServicePhotos } from '@/app/actions/portfolio-photos';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface ServicePhoto {
    id: string;
    url: string;
    position: number;
}

interface ServicePhotoUploadProps {
    serviceId: number;
    initialPhotos: ServicePhoto[];
}

export function ServicePhotoUpload({ serviceId, initialPhotos }: ServicePhotoUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [photos, setPhotos] = useState<ServicePhoto[]>(initialPhotos);
    const [isUploading, setIsUploading] = useState(false);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        for (const f of files) {
            if (!ALLOWED_TYPES.includes(f.type)) {
                toast.error('Допустимы только JPEG, PNG и WebP.');
                resetInput();
                return;
            }
            if (f.size > MAX_FILE_SIZE) {
                toast.error('Файл слишком большой (макс. 5 МБ).');
                resetInput();
                return;
            }
        }

        setIsUploading(true);
        const fd = new FormData();
        fd.set('serviceId', String(serviceId));
        for (const f of files) fd.append('photos', f);

        const result = await uploadServicePhotos(fd);
        setIsUploading(false);
        resetInput();

        if (result.success) {
            setPhotos((prev) =>
                [...prev, ...result.photos].sort((a, b) => a.position - b.position)
            );
            toast.success(
                result.photos.length === 1
                    ? 'Фото загружено'
                    : `Загружено фото: ${result.photos.length}`
            );
        } else {
            toast.error(result.error);
        }
    };

    const resetInput = () => {
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="mt-3 space-y-2">
            {photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((p) => (
                        <img
                            key={p.id}
                            src={p.url}
                            alt=""
                            className="h-14 w-14 flex-shrink-0 rounded-lg border border-gray-100 object-cover"
                        />
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 text-xs font-medium text-gray-500 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Camera className="h-4 w-4" />
                )}
                {isUploading ? 'Загрузка...' : 'Добавить фото'}
            </button>

            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleChange}
                className="hidden"
                data-testid="service-photo-input"
            />
        </div>
    );
}
