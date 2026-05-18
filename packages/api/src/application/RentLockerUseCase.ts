import { LockerResponse, RentLockerRequest } from '../../../shared/index.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { BadRequestError, ConflictError, NotFoundError } from '../domain/services/LockerValidator.js';

export class RentLockerUseCase {
    constructor(
        private readonly lockerRepo: LockerRepository,
        private readonly memberRepo: MemberRepository
    ) {}

    async execute(lockerId: string, request: RentLockerRequest): Promise<LockerResponse> {
        // CA 1 validar socio
        const member = await this.memberRepo.findById(request.memberId);
        if (!member) throw new NotFoundError('El socio provisto no existe');

        // CA 1 validar locker
        const locker = await this.lockerRepo.findById(lockerId);
        if (!locker) throw new NotFoundError('El locker no existe en la base de datos');

        // CA 2  validar estados inválidos
        if (locker.status === 'Maintenance') throw new BadRequestError('No se puede asignar un casillero en mantenimiento');
        if (locker.status === 'Occupied') throw new ConflictError('El locker ya se encuentra ocupado');
        // CA 3 y 4 asignar y manejar concurrencia
        try {
            return await this.lockerRepo.updateRent(lockerId, request.memberId);
        } catch (error: any) {
            if (error.message === 'CONCURRENCY_ERROR') {
                // Atrapamos la condición de carrera y la convertimos en un error de dominio
                throw new ConflictError('El locker acaba de ser alquilado por otro usuario.');
            }
            throw error;
        }
    }
}