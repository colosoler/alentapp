import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockerValidator, ConflictError, BadRequestError } from './LockerValidator.js';
import { LockerRepository } from '../LockerRepository.js';

describe('LockerValidator', () => {
    let mockRepo: LockerRepository;
    let validator: LockerValidator;

    beforeEach(() => {
        // para el validador, solo mockeamos la lectura a la base de datos
        mockRepo = {
            existByNumber: vi.fn().mockResolvedValue(false),
        } as unknown as LockerRepository;

        validator = new LockerValidator(mockRepo);
    });

    it('CA 1 - Debe lanzar ConflictError si el numero de locker ya existe', async () => {
        mockRepo.existByNumber = vi.fn().mockResolvedValue(true);

        await expect(
            validator.validateForCreation(1, 'Pasillo')
        ).rejects.toThrow(ConflictError);
    });

    // para el CA 2 probamos tanto el cero como números negativos
    it('CA 2 - Debe lanzar BadRequestError si el número es 0 o negativo', async () => {
        await expect(
            validator.validateForCreation(0, 'Pasillo')
        ).rejects.toThrow(BadRequestError);

        await expect(
            validator.validateForCreation(-5, 'Pasillo')
        ).rejects.toThrow(BadRequestError);
    });

    it('CA 4 - Debe lanzar BadRequestError si se intenta crear con estado Occupied', async () => {
        await expect(
            validator.validateForCreation(12, 'Pasillo', 'Occupied' as any)
        ).rejects.toThrow(BadRequestError);
    });

    // para el CA 5 agregamos el caso límite de puros espacios
    it('CA 5 - Debe lanzar BadRequestError si la ubicación está vacía o contiene solo espacios', async () => {
        await expect(
            validator.validateForCreation(13, '')
        ).rejects.toThrow(BadRequestError);

        await expect(
            validator.validateForCreation(14, '      ')
        ).rejects.toThrow(BadRequestError);
    });
});