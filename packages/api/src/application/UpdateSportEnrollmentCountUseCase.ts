import { SportDTO, UpdateSportEnrollmentCountRequest } from '@alentapp/shared';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';

export class UpdateSportEnrollmentCountUseCase {
    constructor(
        private readonly sportRepo: SportRepository,
        private readonly sportValidator: SportValidator,
    ) {}

    async execute(
        id: string,
        data: UpdateSportEnrollmentCountRequest,
    ): Promise<SportDTO> {
        this.sportValidator.validateEnrollmentAction(data.action);

        const existingSport = await this.sportRepo.findById(id);

        if (!existingSport) {
            throw new Error('El deporte no existe');
        }

        const nextEnrollmentCount =
            data.action === 'increment'
                ? existingSport.current_enrollment_count + 1
                : existingSport.current_enrollment_count - 1;

        if (nextEnrollmentCount > existingSport.max_capacity) {
            throw new Error('No hay cupo disponible');
        }

        if (nextEnrollmentCount < 0) {
            throw new Error('No se puede decrementar el cupo por debajo de cero');
        }

        return this.sportRepo.updateEnrollmentCount(id, nextEnrollmentCount);
    }
}