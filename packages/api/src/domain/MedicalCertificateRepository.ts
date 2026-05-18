import { MedicalCertificateDTO, CreateMedicalCertificateRequest } from '@alentapp/shared';

export interface MedicalCertificateRepository {
    create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO>;
    findAll(): Promise<MedicalCertificateDTO[]>;
    invalidateActiveByMember(memberId: string): Promise<void>;
    findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]>;
}

export default MedicalCertificateRepository;
