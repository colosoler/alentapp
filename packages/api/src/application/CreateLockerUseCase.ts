import { CreateLockerRequest, LockerResponse } from "../../../shared/index.js";
import { LockerRepository } from "../domain/LockerRepository.js";
import { LockerValidator } from "../domain/services/LockerValidator.js";

export class CreateLockerUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly lockerValidator: LockerValidator
    ) {}

    async execute(req: CreateLockerRequest): Promise<LockerResponse> {
        // validacion de reglas de negocio
        await this.lockerValidator.validateForCreation(
            req.number,
            req.location,
            req.status
        );

        // data final para guardar 
        // sin member asociado (CA 6) y status por default 'Available' si no viene req.status (CA 3)
        const lockerData = {
            number: req.number,
            location: req.location,
            status: req.status ?? 'Available',
            memberId: null
        };

        const savedLocker = await this.lockerRepository.save(lockerData);

        return savedLocker;
    }
}