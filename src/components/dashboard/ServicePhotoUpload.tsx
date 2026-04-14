'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Star, Trash2 } from 'lucide-react';
import { Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    uploadServicePhotos,
    reorderServicePhotos,
    reorderStaffServicePhotos,
    deletePortfolioPhoto,
} from '@/app/actions/portfolio-photos';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface ServicePhoto {
    id: string;
    url: string;
    position: number;
    staffId?: string | null;
}

interface ServicePhotoUploadProps {
    serviceId: number;
    staffId?: string;
    initialPhotos: ServicePhoto[];
}

export function ServicePhotoUpload({ serviceId, staffId, initialPhotos }: ServicePhotoUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [photos, setPhotos] = useState<ServicePhoto[]>(initialPhotos);
    const [isUploading, setIsUploading] = useState(false);
    const [isMutating, setIsMutating] = useState(false);

    const busy = isUploading || isMutating;

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
        if (staffId) fd.append('staffId', staffId);
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

    const commitReorder = async (nextOrder: ServicePhoto[], snapshot: ServicePhoto[]) => {
        setPhotos(nextOrder);
        setIsMutating(true);
        const result = staffId
            ? await reorderStaffServicePhotos(serviceId, staffId, nextOrder.map((p) => p.id))
            : await reorderServicePhotos(serviceId, nextOrder.map((p) => p.id));
        setIsMutating(false);
        if (!result.success) {
            setPhotos(snapshot);
            toast.error(result.error || 'Не удалось изменить порядок.');
        }
    };

    const handleReorder = (nextOrder: ServicePhoto[]) => {
        if (busy) return;
        const snapshot = photos;
        const sameOrder =
            nextOrder.length === snapshot.length &&
            nextOrder.every((p, i) => p.id === snapshot[i].id);
        if (sameOrder) {
            setPhotos(nextOrder);
            return;
        }
        void commitReorder(nextOrder, snapshot);
    };

    const handleSetCover = (photoId: string) => {
        if (busy) return;
        const idx = photos.findIndex((p) => p.id === photoId);
        if (idx <= 0) return;
        const snapshot = photos;
        const next = [photos[idx], ...photos.slice(0, idx), ...photos.slice(idx + 1)];
        void commitReorder(next, snapshot);
    };

    const handleDelete = async (photoId: string) => {
        if (busy) return;
        if (!window.confirm('Удалить это фото?')) return;
        const snapshot = photos;
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setIsMutating(true);
        const result = await deletePortfolioPhoto(photoId);
        setIsMutating(false);
        if (result.success) {
            toast.success('Фото удалено');
        } else {
            setPhotos(snapshot);
            toast.error(result.error || 'Не удалось удалить фото.');
        }
    };

    const renderThumb = (p: ServicePhoto, idx: number) => (
        <>
            <img
                src={p.url}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
            />

            {idx === 0 && (
                <span className="absolute left-0 top-0 inline-flex items-center gap-0.5 rounded-br-md bg-amber-500 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                    <Star className="h-2.5 w-2.5" />
                    Обложка
                </span>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center gap-1 pb-1">
                {idx !== 0 && (
                    <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSetCover(p.id);
                        }}
                        disabled={busy}
                        aria-label="Сделать обложкой"
                        className="pointer-events-auto rounded-full bg-white/90 p-1 text-amber-600 shadow-sm transition hover:bg-white disabled:opacity-60"
                    >
                        <Star className="h-3 w-3" />
                    </button>
                )}
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                    }}
                    disabled={busy}
                    aria-label="Удалить фото"
                    className="pointer-events-auto rounded-full bg-white/90 p-1 text-red-600 shadow-sm transition hover:bg-white disabled:opacity-60"
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>
        </>
    );

    return (
        <div className="mt-3 space-y-2">
            {photos.length > 0 && (
                <Reorder.Group
                    axis="x"
                    values={photos}
                    onReorder={handleReorder}
                    className="flex gap-2 overflow-x-auto pb-1"
                >
                    {photos.map((p, idx) => (
                        <Reorder.Item
                            key={p.id}
                            value={p}
                            whileDrag={{ scale: 1.05, zIndex: 10 }}
                            className="group relative h-14 w-14 flex-shrink-0 cursor-grab overflow-hidden rounded-lg border border-gray-100 bg-gray-50 active:cursor-grabbing"
                        >
                            {renderThumb(p, idx)}
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            )}

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
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
