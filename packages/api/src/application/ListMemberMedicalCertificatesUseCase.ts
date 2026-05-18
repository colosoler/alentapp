import { MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

export class ListMemberMedicalCertificatesUseCase {
    constructor(private readonly certRepo: MedicalCertificateRepository) {}

    async execute(memberId: string): Promise<MedicalCertificateDTO[]> {
        return this.certRepo.findByMemberId(memberId);
    }
}

export default ListMemberMedicalCertificatesUseCase;
