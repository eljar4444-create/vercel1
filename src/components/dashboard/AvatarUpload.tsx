'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, UserCircle } from 'lucide-react';
import { uploadAvatar } from '@/app/actions/uploadAvatar';

interface AvatarUploadProps {
    profileId: number;
    profileName: string;
    currentImageUrl: string | null;
}

export function AvatarUpload({ profileId, profileName, currentImageUrl }: AvatarUploadProps) {
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
        formData.set('profile_id', profileId.toString());

        const result = await uploadAvatar(formData);

        setIsUploading(false);

        if (result.success && result.url) {
            setPreviewUrl(result.url);
        } else {
            setPreviewUrl(currentImageUrl);
            setError(result.error || 'Ошибка загрузки');
        }
    };

    return (
        <div className="relative w-20 h-20 flex-shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-100 bg-gray-100 flex items-center justify-center">
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={profileName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <UserCircle className="w-10 h-10 text-gray-300" />
                )}
            </div>

            {/* Uploading spinner */}
            {isUploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
            )}

            {/* Superimposed Camera Button */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none"
                title="Изменить фото"
            >
                <Camera className="h-3 w-3" />
            </button>

            {error && (
                <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 whitespace-nowrap">{error}</p>
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
