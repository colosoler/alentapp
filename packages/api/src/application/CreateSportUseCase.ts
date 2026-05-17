import { CreateSportRequest, SportDTO } from '@alentapp/shared';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';

export class CreateSportUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(data: CreateSportRequest): Promise<SportDTO> {
        this.sportValidator.validateRequiredFields(data);
        this.sportValidator.validateName(data.name);
        this.sportValidator.validateDescription(data.description);
        this.sportValidator.validateMaxCapacity(data.max_capacity);
        this.sportValidator.validateAdditionalPrice(data.additional_price);
        this.sportValidator.validateRequiresMedicalCertificate(data.requires_medical_certificate);

        const existingSport = await this.sportRepo.findByName(data.name);
        if (existingSport) {
            throw new Error('Ya existe ese deporte');
        }

        return this.sportRepo.create(data);
    }
}