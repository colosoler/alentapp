import { MedicalCertificateDTO, CreateMedicalCertificateRequest } from '@alentapp/shared';

export interface MedicalCertificateRepository {
    create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO>;
    invalidateActiveByMember(memberId: string): Promise<void>;
    findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]>;
    findById(id: string): Promise<MedicalCertificateDTO | null>;
    delete(id: string): Promise<void>;
}

export default MedicalCertificateRepository;
