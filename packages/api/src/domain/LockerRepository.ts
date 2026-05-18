import { LockerItemResponse, LockerResponse, UpdateLockerRequest } from "../../../shared/index.js";
import { LockerStatus } from "../generated/client/index.js";

// puerto de salida
export interface LockerRepository {
    existByNumber(number: number): Promise<boolean>;
    save(locker: Omit<LockerResponse, 'id'>): Promise<LockerResponse>;
    findAll(status?: LockerStatus): Promise<LockerItemResponse[]>;
    findById(id: string): Promise<LockerResponse | null>;
    updateRent(id: string, memberId: string): Promise<LockerResponse>;
    updateRelease(id: string): Promise<LockerResponse>;
    update(id: string, data: UpdateLockerRequest): Promise<LockerResponse>;
    findByNumber(number: number): Promise<LockerResponse | null>;
}