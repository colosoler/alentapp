import { LockerResponse } from "../../../shared/index.js";

// puerto de salida
export interface LockerRepository {
    existByNumber(number: number): Promise<boolean>;
    save(locker: Omit<LockerResponse, 'id'>): Promise<LockerResponse>;
}