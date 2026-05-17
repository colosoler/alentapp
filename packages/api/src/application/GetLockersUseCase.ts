import { LockerItemResponse } from "../../../shared/index.js";
import { LockerRepository } from "../domain/LockerRepository.js";
import { BadRequestError } from "../domain/services/LockerValidator.js";
import { LockerStatus } from "../generated/client/index.js";

export class GetLockersUseCase {
    constructor(
        private readonly lockerRepository: LockerRepository
    ) {}

    async execute(statusParam?: string): Promise<LockerItemResponse[]> {
        let statusFilter: LockerStatus | undefined = undefined;

        if (statusParam) {
            const validStatuses: LockerStatus[] = ['Available', 'Maintenance', 'Occupied'];
            if (!validStatuses.includes(statusParam as LockerStatus)) {
                throw new BadRequestError(`El estado filtrado '${statusParam}' no es valido`);
            }
            statusFilter = statusParam as LockerStatus;
        }

        return this.lockerRepository.findAll(statusFilter);
    }
}