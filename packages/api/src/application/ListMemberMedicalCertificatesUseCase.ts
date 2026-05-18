import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO } from '@alentapp/shared';

export class ListMemberMedicalCertificatesUseCase {
    constructor(private readonly certRepo: MedicalCertificateRepository) {}

    async execute(memberId: string): Promise<MedicalCertificateDTO[]> {
        const certs = await this.certRepo.findByMemberId(memberId);
        return certs;
    }
}

export default ListMemberMedicalCertificatesUseCase;
