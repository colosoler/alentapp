import { MedicalCertificateDTO, CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';

export interface MedicalCertificateRepository {
    create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO>;
    findAll(): Promise<MedicalCertificateDTO[]>;
    findById(id: string): Promise<MedicalCertificateDTO | null>;
    invalidateActiveByMember(memberId: string): Promise<void>;
    findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]>;
    update(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO>;
    delete(id: string): Promise<void>;
}

export default MedicalCertificateRepository;
