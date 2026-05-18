import { MedicalCertificateDTO, UpdateMedicalCertificateRequest } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';

export class UpdateMedicalCertificateUseCase {
    constructor(
        private readonly certRepo: MedicalCertificateRepository,
        private readonly validator: MedicalCertificateValidator,
    ) {}

    async execute(id: string, data: UpdateMedicalCertificateRequest = {}): Promise<MedicalCertificateDTO> {
        this.validator.validateCertificateId(id);

        const existingCertificate = await this.certRepo.findById(id);
        if (!existingCertificate) {
            throw new Error('El certificado no existe');
        }

        this.validator.validateUpdatePayload(data);

        const finalIssueDate = data.issueDate ?? existingCertificate.issue_date;
        const finalExpirationDate = data.expirationDate ?? existingCertificate.expiration_date;

        this.validator.validateIssueDate(finalIssueDate);
        this.validator.validateExpirationDate(finalIssueDate, finalExpirationDate);

        return this.certRepo.update(id, data);
    }
}

export default UpdateMedicalCertificateUseCase;