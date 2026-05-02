'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadServicePhotos, uploadPortfolioFile, deletePortfolioPhoto } from '@/app/actions/portfolio-photos';
import type { StaffOption } from './AddServiceForm';
import { useTranslations } from 'next-intl';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface PendingPhoto {
    /** Client-generated key for React list rendering */
    key: string;
    url: string;
    staffId: string | null;
}

export interface PortfolioItem {
    id: string;
    url: string;
    staffId: string | null;
}

interface PortfolioUploadInlineProps {
    /** If provided, uploads save directly to DB. If omitted, uploads go to storage only. */
    serviceId?: number;
    assignedStaff: StaffOption[];
    /** Called in pending mode (no serviceId) when photos change. */
    onPendingPhotosChange?: (photos: PendingPhoto[]) => void;
}

let pendingKeyCounter = 0;

export function PortfolioUploadInline({
    serviceId,
    assignedStaff,
    onPendingPhotosChange,
}: PortfolioUploadInlineProps) {
    const t = useTranslations('dashboard.provider.media');
    const inputRef = useRef<HTMLInputElement>(null);
    // Saved photos (have DB id, only used when serviceId is present)
    const [savedPhotos, setSavedPhotos] = useState<PortfolioItem[]>([]);
    // Pending photos (no DB record yet, used when serviceId is absent)
    const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const isPendingMode = serviceId == null;
    const busy = isUploading || !!deletingId;

    const defaultStaffId = assignedStaff.length === 1 ? assignedStaff[0].id : null;

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;

        for (const f of files) {
            if (!ALLOWED_TYPES.includes(f.type)) {
                toast.error(t('invalidImageType'));
                resetInput();
                return;
            }
            if (f.size > MAX_FILE_SIZE) {
                toast.error(t('fileTooLarge'));
                resetInput();
                return;
            }
        }

        setIsUploading(true);

        if (isPendingMode) {
            // Pending mode: upload each file individually, store URL in state
            const newPending: PendingPhoto[] = [];
            for (const file of files) {
                const fd = new FormData();
                fd.set('photo', file);
                const result = await uploadPortfolioFile(fd);
                if (result.success) {
                    newPending.push({
                        key: `pending-${++pendingKeyCounter}`,
                        url: result.url,
                        staffId: defaultStaffId,
                    });
                } else {
                    toast.error(result.error);
                }
            }
            if (newPending.length > 0) {
                const updated = [...pendingPhotos, ...newPending];
                setPendingPhotos(updated);
                onPendingPhotosChange?.(updated);
                toast.success(
                    newPending.length === 1
                        ? t('photoUploaded')
                        : t('photosUploaded', { count: newPending.length })
                );
            }
        } else {
            // Direct mode: upload and save to DB in one shot
            const fd = new FormData();
            fd.set('serviceId', String(serviceId));
            if (defaultStaffId) fd.set('staffId', defaultStaffId);
            for (const f of files) fd.append('photos', f);

            const result = await uploadServicePhotos(fd);
            if (result.success) {
                const newSaved = result.photos.map((p) => ({
                    id: p.id,
                    url: p.url,
                    staffId: defaultStaffId,
                }));
                setSavedPhotos((prev) => [...prev, ...newSaved]);
                toast.success(
                    result.photos.length === 1
                        ? t('photoUploaded')
                        : t('photosUploaded', { count: result.photos.length })
                );
            } else {
                toast.error(result.error);
            }
        }

        setIsUploading(false);
        resetInput();
    };

    const handleDeleteSaved = async (photoId: string) => {
        if (busy) return;
        if (!window.confirm(t('deletePhotoConfirm'))) return;

        setDeletingId(photoId);
        const result = await deletePortfolioPhoto(photoId);
        setDeletingId(null);

        if (result.success) {
            setSavedPhotos((prev) => prev.filter((p) => p.id !== photoId));
            toast.success(t('photoDeleted'));
        } else {
            toast.error(result.error || t('photoDeleteError'));
        }
    };

    const handleDeletePending = (key: string) => {
        const updated = pendingPhotos.filter((p) => p.key !== key);
        setPendingPhotos(updated);
        onPendingPhotosChange?.(updated);
    };

    const handleStaffChange = (itemKey: string, newStaffId: string | null) => {
        if (isPendingMode) {
            const updated = pendingPhotos.map((p) =>
                p.key === itemKey ? { ...p, staffId: newStaffId } : p
            );
            setPendingPhotos(updated);
            onPendingPhotosChange?.(updated);
        } else {
            setSavedPhotos((prev) =>
                prev.map((p) => (p.id === itemKey ? { ...p, staffId: newStaffId } : p))
            );
        }
    };

    const resetInput = () => {
        if (inputRef.current) inputRef.current.value = '';
    };

    const allPhotos = isPendingMode
        ? pendingPhotos.map((p) => ({ key: p.key, url: p.url, staffId: p.staffId, isPending: true }))
        : savedPhotos.map((p) => ({ key: p.id, url: p.url, staffId: p.staffId, isPending: false }));

    return (
        <div className="flex flex-col gap-3">
            {allPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {allPhotos.map((p) => (
                        <div key={p.key} className="group relative flex flex-col gap-1.5">
                            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.url} alt="" className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() =>
                                        p.isPending
                                            ? handleDeletePending(p.key)
                                            : handleDeleteSaved(p.key)
                                    }
                                    disabled={deletingId === p.key}
                                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
                                    aria-label={t('delete')}
                                >
                                    {deletingId === p.key ? (
                                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                        <X className="h-2.5 w-2.5" />
                                    )}
                                </button>
                            </div>
                            {assignedStaff.length > 1 && (
                                <select
                                    value={p.staffId ?? ''}
                                    onChange={(e) =>
                                        handleStaffChange(p.key, e.target.value || null)
                                    }
                                    className="w-16 truncate rounded border border-gray-200 bg-white px-0.5 py-0.5 text-[10px] text-gray-700 focus:border-gray-400 focus:outline-none"
                                    title={t('staffOwnerTitle')}
                                >
                                    <option value="">{t('master')}</option>
                                    {assignedStaff.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-500 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Camera className="h-3.5 w-3.5" />
                )}
                {isUploading ? t('uploading') : t('addPortfolioExamples')}
            </button>

            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUpload}
                className="hidden"
            />
        </div>
    );
}
