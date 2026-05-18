import { LockerResponse } from '../../../shared/index.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { NotFoundError, BadRequestError, ConflictError } from '../domain/services/LockerValidator.js';

export class ReleaseLockerUseCase {
    constructor(private readonly lockerRepo: LockerRepository) {}

    async execute(lockerId: string): Promise<LockerResponse> {
        const locker = await this.lockerRepo.findById(lockerId);
        
        // CA 1 validar existencia
        if (!locker) {
            throw new NotFoundError('El casillero no fue encontrado en el sistema');
        }

        // CA 2 validar estados
        if (locker.status === 'Available') {
            throw new ConflictError('El casillero ya se encuentra disponible');
        }
        
        if (locker.status === 'Maintenance') {
            throw new BadRequestError('No se puede liberar un casillero en mantenimiento');
        }

        return await this.lockerRepo.updateRelease(lockerId);
    }
}