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

export async function savePublicUpload(file: File, target: UploadTarget) {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    const safeName = sanitizeFilename(file.name, target.fallbackName);
    const timestamp = Date.now();

    if (token) {
        const blobFilename = `${target.blobFolder}/${target.filenamePrefix}-${timestamp}-${safeName}`;
        const { url } = await put(blobFilename, file, {
            access: 'public',
            token,
        });

        return { url, storage: 'blob' as const };
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
    }

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
