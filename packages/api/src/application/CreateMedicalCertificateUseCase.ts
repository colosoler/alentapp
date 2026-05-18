import { CreateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';

export class CreateMedicalCertificateUseCase {
    constructor(
        private readonly certRepo: MedicalCertificateRepository,
        private readonly memberRepo: MemberRepository,
        private readonly validator: MedicalCertificateValidator,
    ) {}

    async execute(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
        this.validator.validateRequiredFields(data);
        this.validator.validateMemberId(data.member_id);
        this.validator.validateIssueDate(data.issue_date);
        this.validator.validateExpirationDate(data.issue_date, data.expiration_date);

        const existingMember = await this.memberRepo.findById(data.member_id);
        if (!existingMember) {
            throw new Error('El socio especificado no existe');
        }

        await this.certRepo.invalidateActiveByMember(data.member_id);

        return this.certRepo.create(data);
    }
}

export default CreateMedicalCertificateUseCase;
