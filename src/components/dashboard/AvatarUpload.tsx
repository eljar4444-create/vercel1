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
        <div className="flex items-center gap-4">
            {/* Avatar circle */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100 group cursor-pointer flex-shrink-0"
            >
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={profileName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <UserCircle className="w-8 h-8 text-gray-300" />
                    </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                        <Camera className="w-5 h-5 text-white" />
                    )}
                </div>

                {/* Uploading spinner (always visible) */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                )}
            </button>

            {/* Name + change link */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Привет, {profileName.split(' ')[0]} 👋
                </h1>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                    {isUploading ? 'Загрузка...' : 'Изменить фото'}
                </button>
                {error && (
                    <p className="text-xs text-red-500 mt-0.5">{error}</p>
                )}
            </div>

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
