import { LockerResponse } from '../../../shared/index.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { NotFoundError, BadRequestError } from '../domain/services/LockerValidator.js';

export class StartLockerMaintenanceUseCase {
    constructor(private readonly lockerRepo: LockerRepository) {}

    async execute(lockerId: string): Promise<LockerResponse> {
        const locker = await this.lockerRepo.findById(lockerId);

        // CA 1 validar existencia
        if (!locker) {
            throw new NotFoundError('El casillero no existe en el sistema');
        }

        // CA 2 reglas de estado
        if (locker.status === 'Occupied') {
            throw new BadRequestError('No se puede enviar a mantenimiento un casillero en uso. Primero debe liberarlo.');
        }

        if (locker.status === 'Maintenance') {
            throw new BadRequestError('El casillero ya se encuentra en estado de mantenimiento.');
        }

        // CA 3 y CA 4 actualizamos a Maintenance, el member_id queda null
        return await this.lockerRepo.updateStatus(lockerId, 'Maintenance');
    }
}