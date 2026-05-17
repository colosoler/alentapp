import { SportDTO, UpdateSportRequest } from '@alentapp/shared';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';

export class UpdateSportUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(id: string, data: UpdateSportRequest): Promise<SportDTO> {
        const existingSport = await this.sportRepo.findById(id);

        if (!existingSport) {
            throw new Error('El deporte no existe');
        }

        if (data.description !== undefined) {
            this.sportValidator.validateDescription(data.description);
        }

        if (data.max_capacity !== undefined) {
            this.sportValidator.validateMaxCapacity(data.max_capacity);

            if (existingSport.current_enrollment_count > data.max_capacity) {
                throw new Error('No hay cupo disponible');
            }
        }

        return this.sportRepo.update(id, data);
    }
}