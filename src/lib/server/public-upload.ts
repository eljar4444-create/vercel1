import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { put } from '@vercel/blob';

type UploadTarget = {
    blobFolder: string;
    localFolder: string;
    filenamePrefix: string;
    fallbackName: string;
};

function sanitizeFilename(filename: string, fallbackName: string) {
    const cleaned = filename.replace(/[^a-zA-Z0-9.-]/g, '');
    return cleaned.length > 0 ? cleaned : fallbackName;
}

async function saveLocally(
    file: File,
    safeName: string,
    timestamp: number,
    target: UploadTarget,
) {
    const localDir = path.join(process.cwd(), 'public', target.localFolder);
    const localFilename = `${target.filenamePrefix}-${timestamp}-${safeName}`;
    const localPath = path.join(localDir, localFilename);
    const bytes = Buffer.from(await file.arrayBuffer());

    await mkdir(localDir, { recursive: true });
    await writeFile(localPath, bytes);

    return {
        url: `/${target.localFolder}/${localFilename}`,
        storage: 'local' as const,
    };
}

export async function savePublicUpload(file: File, target: UploadTarget) {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    const safeName = sanitizeFilename(file.name, target.fallbackName);
    const timestamp = Date.now();

    if (token) {
        const blobFilename = `${target.blobFolder}/${target.filenamePrefix}-${timestamp}-${safeName}`;
        try {
            const { url } = await put(blobFilename, file, {
                access: 'public',
                token,
            });
            return { url, storage: 'blob' as const };
        } catch (err) {
            // In development, fall back to local storage if Blob fails
            if (process.env.NODE_ENV !== 'production') {
                console.warn('Vercel Blob upload failed, falling back to local storage:', err);
                return saveLocally(file, safeName, timestamp, target);
            }
            throw err;
        }
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
    }

    return saveLocally(file, safeName, timestamp, target);
}
