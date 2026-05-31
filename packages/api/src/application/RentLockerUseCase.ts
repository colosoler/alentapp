import { LockerResponse, RentLockerRequest } from '../../../shared/index.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { BadRequestError, ConflictError, LockerValidator, NotFoundError } from '../domain/services/LockerValidator.js';

export class RentLockerUseCase {
    constructor(
        private readonly lockerRepo: LockerRepository,
        private readonly memberRepo: MemberRepository,
        private readonly validator: LockerValidator
    ) {}

    async execute(lockerId: string, request: RentLockerRequest): Promise<LockerResponse> {
        // CA 1 validar socio
        const member = await this.memberRepo.findById(request.memberId);
        if (!member) throw new NotFoundError('El socio provisto no existe');

        // CA 1 y 2 validar locker delegada al validator
        const locker = await this.lockerRepo.findById(lockerId);
        this.validator.validateForRent(locker);

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