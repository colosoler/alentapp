import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO } from '@alentapp/shared';

export class GetSportByIdUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(id: string): Promise<SportDTO> {
        this.sportValidator.validateSportId(id);

        const sport = await this.sportRepo.findById(id);

        if (!sport) {
            throw new Error('El deporte no existe');
        }

        return sport;
    }
}
