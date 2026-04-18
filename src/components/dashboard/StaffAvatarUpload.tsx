'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, UserCircle } from 'lucide-react';
import { uploadStaffAvatar } from '@/app/actions/uploadStaffAvatar';

interface StaffAvatarUploadProps {
    staffId: string;
    staffName: string;
    currentImageUrl: string | null;
}

export function StaffAvatarUpload({ staffId, staffName, currentImageUrl }: StaffAvatarUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Instant preview
        setPreviewUrl(URL.createObjectURL(file));
        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.set('file', file);
        formData.set('staff_id', staffId);

        try {
            const result = await uploadStaffAvatar(formData);

            setIsUploading(false);

            if (result.success && result.url) {
                setPreviewUrl(result.url);
            } else {
                setPreviewUrl(currentImageUrl);
                setError(result.error || 'Ошибка загрузки');
            }
        } catch {
            setIsUploading(false);
            setPreviewUrl(currentImageUrl);
            setError('Не удалось загрузить файл. Попробуйте снова.');
        }
    };

    return (
        <div className="relative w-24 h-24 flex-shrink-0 mx-auto">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-stone-200 bg-stone-100 flex items-center justify-center">
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={staffName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <UserCircle className="w-12 h-12 text-stone-300" />
                )}
            </div>

            {/* Uploading spinner */}
            {isUploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
            )}

            {/* Superimposed Camera Button */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none"
                title="Изменить фото"
            >
                <Camera className="h-4 w-4" />
            </button>

            {error && (
                <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-red-500 whitespace-nowrap">{error}</p>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
