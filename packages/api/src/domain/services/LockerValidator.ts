import { LockerRepository } from "../LockerRepository.js";
import { LockerStatus } from "../../../../shared/index.js";


// TO DO: mover estos errores a un archivo global de errores
export class ConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}

export class BadRequestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BadRequestError';
    }
}

// encargado de validar los CA 1,2,4 y 5
export class LockerValidator {
    constructor(
        private readonly lockerRepository: LockerRepository
    ) {}

    async validateForCreation(number: number, location: string, status?: LockerStatus): Promise<void> {
        this.validateNumber(number);
        this.validateLocation(location);
        this.validateInitialStatus(status);
        await this.validateNumberIsUnique(number);
    }   

    private validateNumber(number: number): void {
        // CA 2: que sea tipo entero y mayor a 0
        if (!Number.isInteger(number) || number <= 0) {
            throw new BadRequestError('El número de locker debe ser un valor entero mayor a cero');
        }
    }

    private validateLocation(location: string): void {
        // CA 5: que no este vacia
        if (!location || location.trim() === '') {
            throw new BadRequestError('La ubicacion del locker es un campo obligatorio');
        }
    }

    private validateInitialStatus(status?: string): void {
        // CA 4: que no se cree ocupado
        if (status === 'Occupied') {
            throw new BadRequestError('Estado inválido. Un locker nuevo solo puede crearse como Disponible o En Mantenimiento');
        }

        if (status && status !== 'Available' && status !== 'Maintenance') {
            throw new BadRequestError('Estado inválido. Un locker nuevo solo puede crearse como Disponible o En Mantenimiento');
        }
    }

    private async validateNumberIsUnique(number: number): Promise<void> {
        // CA 1: que el number sea unico
        // usamos el puerto locker repository
        const exists = await this.lockerRepository.existByNumber(number);
        if (exists) {
            throw new ConflictError('El número de locker ingresado ya se encuentra registrado');
        }
    }
}