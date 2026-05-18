import { MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

export class GetMedicalCertificateByIdUseCase {
    constructor(private readonly certRepo: MedicalCertificateRepository) {}

    async execute(id: string): Promise<MedicalCertificateDTO> {
        const cert = await this.certRepo.findById(id);
        if (!cert) throw new Error('El certificado no existe');
        return cert;
    }
}

export default GetMedicalCertificateByIdUseCase;
