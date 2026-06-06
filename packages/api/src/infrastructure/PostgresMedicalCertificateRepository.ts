import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { CreateMedicalCertificateRequest, MedicalCertificateDTO, MedicalCertificateStatus, UpdateMedicalCertificateRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBMedicalCertificate = {
    id: string;
    member_id: string;
    issue_date: Date;
    expiration_date: Date | null;
    file_url?: string | null;
    status: string;
    invalidated_at: Date | null;
    created_at: Date;
    updated_at: Date;
};

export class PostgresMedicalCertificateRepository implements MedicalCertificateRepository {
    async create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
        const cert = await prisma.medicalCertificate.create({
            data: {
                member_id: data.member_id,
                issue_date: new Date(data.issue_date),
                expiration_date: data.expiration_date ? new Date(data.expiration_date) : undefined,
                file_url: (data as any).file_url ?? undefined,
                status: 'Active',
            },
        });

        return this.mapToDTO(cert as DBMedicalCertificate);
    }

    async findById(id: string): Promise<MedicalCertificateDTO | null> {
        const cert = await prisma.medicalCertificate.findUnique({
            where: { id },
        });

        return cert ? this.mapToDTO(cert as DBMedicalCertificate) : null;
    }

    async invalidateActiveByMember(memberId: string): Promise<void> {
        await prisma.medicalCertificate.updateMany({
            where: { member_id: memberId, status: 'Active' },
            data: { status: 'Inactive', invalidated_at: new Date() },
        });
    }

    async findAll(): Promise<MedicalCertificateDTO[]> {
        const certs = await prisma.medicalCertificate.findMany({
            orderBy: { issue_date: 'desc' },
        });

        return certs.map((c) => this.mapToDTO(c as DBMedicalCertificate));
    }

    async findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]> {
        const certs = await prisma.medicalCertificate.findMany({
            where: { member_id: memberId },
            orderBy: { issue_date: 'desc' },
        });

        return certs.map((c) => this.mapToDTO(c as DBMedicalCertificate));
    }

    async update(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
        const updateData: any = {
            updated_at: new Date(),
        };

        if (data.issueDate !== undefined) {
            updateData.issue_date = new Date(data.issueDate);
        }

        if (data.expirationDate !== undefined) {
            updateData.expiration_date = new Date(data.expirationDate);
        }

        if (data.status !== undefined) {
            updateData.status = data.status;
        }

        if ((data as any).file_url !== undefined) {
            updateData.file_url = (data as any).file_url;
        }

        const cert = await prisma.medicalCertificate.update({
            where: { id },
            data: updateData,
        });

        return this.mapToDTO(cert as DBMedicalCertificate);
    }

    async delete(id: string): Promise<void> {
        const cert = await prisma.medicalCertificate.findUnique({ where: { id } });
        if (cert && (cert as any).file_url) {
            const { deleteMedicalCertificateFileByUrl } = await import('./FileStorage.js');
            await deleteMedicalCertificateFileByUrl((cert as any).file_url);
        }
        await prisma.medicalCertificate.delete({ where: { id } });
    }

    private mapToDTO(cert: DBMedicalCertificate): MedicalCertificateDTO {
        return {
            id: cert.id,
            member_id: cert.member_id,
            issue_date: cert.issue_date.toISOString(),
            expiration_date: cert.expiration_date ? cert.expiration_date.toISOString() : undefined,
            file_url: (cert as any).file_url ?? undefined,
            status: cert.status as MedicalCertificateStatus,
            created_at: cert.created_at.toISOString(),
            updated_at: cert.updated_at.toISOString(),
            invalidated_at: cert.invalidated_at ? cert.invalidated_at.toISOString() : undefined,
        };
    }
}

export default PostgresMedicalCertificateRepository;

