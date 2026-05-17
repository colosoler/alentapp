import { CreateSportRequest } from '@alentapp/shared';

export class SportValidator {
    validateRequiredFields(data: Partial<CreateSportRequest> | undefined): void {
        if (
            !data ||
            typeof data.name !== 'string' ||
            typeof data.description !== 'string' ||
            typeof data.max_capacity !== 'number' ||
            typeof data.additional_price !== 'number' ||
            typeof data.requires_medical_certificate !== 'boolean'
        ) {
            throw new Error('Faltan campos requeridos');
        }
    }

    validateName(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new Error('El nombre del deporte es obligatorio');
        }
    }

    validateDescription(description: string): void {
        if (!description || description.trim().length === 0) {
            throw new Error('La descripcion del deporte es obligatoria');
        }
    }

    validateMaxCapacity(maxCapacity: number): void {
        if (!Number.isInteger(maxCapacity) || maxCapacity <= 0) {
            throw new Error('La capacidad maxima debe ser mayor a cero');
        }
    }

    validateAdditionalPrice(additionalPrice: number): void {
        if (typeof additionalPrice !== 'number' || Number.isNaN(additionalPrice)) {
            throw new Error('El precio adicional es obligatorio');
        }
    }

    validateRequiresMedicalCertificate(requiresMedicalCertificate: unknown): void {
        if (typeof requiresMedicalCertificate !== 'boolean') {
            throw new Error('Faltan campos requeridos');
        }
    }
}