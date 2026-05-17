import { LockerItemResponse, LockerResponse } from "../../../shared/index.js";
import { LockerStatus } from "../generated/client/index.js";

// puerto de salida
export interface LockerRepository {
    existByNumber(number: number): Promise<boolean>;
    save(locker: Omit<LockerResponse, 'id'>): Promise<LockerResponse>;
    findAll(status?: LockerStatus): Promise<LockerItemResponse[]>;
}