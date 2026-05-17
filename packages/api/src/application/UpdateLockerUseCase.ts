import { LockerRepository } from "../domain/LockerRepository.js";
import { UpdateLockerRequest, LockerResponse } from "../../../shared/index.js";
import { BadRequestError, NotFoundError, ConflictError } from "../domain/services/LockerValidator.js";

export class UpdateLockerUseCase {
    constructor(private readonly lockerRepository: LockerRepository) {}

    async execute(id: string, data: UpdateLockerRequest): Promise<LockerResponse> {

        // CA 1 validar existencia
        const existingLocker = await this.lockerRepository.findById(id);
        if (!existingLocker) {
            throw new NotFoundError('Locker no encontrado.');
        }

        // CA 2 validar número
        if (data.number !== undefined) {
            if (typeof data.number !== 'number' || data.number <= 0) {
                throw new BadRequestError('El número de locker debe ser un valor entero mayor a cero.');
            }

            if (data.number !== existingLocker.number) {
                const isConflict = await this.lockerRepository.findByNumber(data.number);
                if (isConflict) {
                    throw new ConflictError('El número de locker ingresado ya se encuentra registrado.');
                }
            }
        }

        // CA 4 validar location
        if (data.location !== undefined && (typeof data.location !== 'string' || data.location.trim() === '')) {
            throw new BadRequestError('La ubicacion del locker no puede estar vacia.');
        }

        return await this.lockerRepository.update(id, {
            number: data.number,
            location: data.location
        });
    }
}