import { LockerRepository } from "../domain/LockerRepository.js";
import { BadRequestError, NotFoundError } from "../domain/services/LockerValidator.js";

export class DeleteLockerUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(id: string): Promise<void> {
        // CA 1 validar existencia
        const locker = await this.lockerRepository.findById(id);
        if (!locker) {
            throw new NotFoundError('Locker no encontrado.');
        }

        // CA 2 validar que no esté ocupado
        if (locker.status === 'Occupied') {
            throw new BadRequestError('No se puede eliminar un casillero que actualmente está siendo alquilado por un socio.');
        }

        // CA 3 borrado físico
        await this.lockerRepository.delete(id);
    }
}