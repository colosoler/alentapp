import { LockerResponse } from '../../../shared/index.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { NotFoundError, BadRequestError } from '../domain/services/LockerValidator.js';

export class EndLockerMaintenanceUseCase {
    constructor(private readonly lockerRepo: LockerRepository) {}

    async execute(lockerId: string): Promise<LockerResponse> {
        const locker = await this.lockerRepo.findById(lockerId);

        // CA 1 validar existencia
        if (!locker) {
            throw new NotFoundError('El casillero no existe en el sistema');
        }

        // CA 2 reglas de estado (Debe estar estrictamente en mantenimiento)
        if (locker.status !== 'Maintenance') {
            throw new BadRequestError('El casillero no se encuentra en mantenimiento en este momento.');
        }

        // CA 3 actualizamos a Available
        return await this.lockerRepo.updateStatus(lockerId, 'Available');
    }
}