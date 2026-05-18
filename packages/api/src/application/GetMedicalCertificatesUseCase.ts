import { MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

export class GetMedicalCertificatesUseCase {
    constructor(private readonly certRepo: MedicalCertificateRepository) {}

    async execute(): Promise<MedicalCertificateDTO[]> {
        return this.certRepo.findAll();
    }
}

export default GetMedicalCertificatesUseCase;
