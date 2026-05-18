import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'medical-certificates');

export async function ensureUploadsDir() {
    await fs.mkdir(uploadsRoot, { recursive: true });
}

export async function saveMedicalCertificateFile(buffer: Buffer, originalName: string): Promise<string> {
    await ensureUploadsDir();
    const ext = path.extname(originalName).toLowerCase() || '.pdf';
    if (ext !== '.pdf') {
        throw new Error('El archivo debe ser un PDF');
    }
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(uploadsRoot, filename);
    await fs.writeFile(filepath, buffer);
    return `/uploads/medical-certificates/${filename}`;
}

export async function deleteMedicalCertificateFileByUrl(fileUrl?: string | null): Promise<void> {
    if (!fileUrl) return;
    try {
        const parts = fileUrl.split('/');
        const filename = parts[parts.length - 1];
        const filepath = path.join(uploadsRoot, filename);
        await fs.unlink(filepath);
    } catch (err) {
        // ignore
    }
}

export default null;
