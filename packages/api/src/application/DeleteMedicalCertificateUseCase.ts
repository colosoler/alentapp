import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

export class DeleteMedicalCertificateUseCase {
    constructor(private readonly certRepo: MedicalCertificateRepository) {}

    async execute(id: string): Promise<void> {
        const cert = await this.certRepo.findById(id);
        if (!cert) {
            throw new Error('El certificado no existe');
        }

        await this.certRepo.delete(id);
    }
}

export default DeleteMedicalCertificateUseCase;
