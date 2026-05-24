import { beforeEach, describe, expect, it, vi } from "vitest";
import { LockerRepository } from "../domain/LockerRepository.js";
import { CreateLockerUseCase } from "./CreateLockerUseCase.js";
import { BadRequestError, ConflictError, LockerValidator } from "../domain/services/LockerValidator.js";

describe('CreateLockerUseCase', () => {
    let mockRepo: LockerRepository;
    let validator: LockerValidator;
    let useCase: CreateLockerUseCase;

    beforeEach(() => {
        // preparamos el mock del repositorio para cada test
        mockRepo = {
            existByNumber: vi.fn().mockResolvedValue(false),
            save: vi.fn().mockImplementation((locker) => Promise.resolve({...locker, id: 'uuid-123'})),
        } as unknown as LockerRepository;

        // instanciamso el servicio de dominio real inyectandole el repositorio mockeado
        validator = new LockerValidator(mockRepo);

        // instanciamos el caso de uso con ambas dependencias
        useCase = new CreateLockerUseCase(mockRepo, validator);
    })

    it('CA 1 - Debe lanzar ConflictError si el numero de locker ya existe', async () => {
        mockRepo.existByNumber = vi.fn().mockResolvedValue(true);

        await expect(
            useCase.execute({ number: 1, location: 'Pasillo'})
        ).rejects.toThrow(ConflictError);
    });

    it('CA 2 - Debe lanzar BadRequestError si el numero es menor o igual a 0', async () => {
        await expect(
            useCase.execute({ number: 0, location: 'Pasillo'})
        ).rejects.toThrow(BadRequestError);
        await expect(
            useCase.execute({ number: -5, location: 'Pasillo'})
        ).rejects.toThrow(BadRequestError);
    });

    it('CA 3 y CA 6 - Debe crear el locker con estado Available por defecto u memberId en null', async () => {
        const result = await useCase.execute({
            number: 10,
            location: 'Pasillo Principal',
        });

        expect(mockRepo.existByNumber).toHaveBeenCalledWith(10);
        expect(mockRepo.save).toHaveBeenCalled();
        expect(result.status).toBe('Available');
        expect(result.memberId).toBeNull();
    });

    it('CA 4 - Debe permitir crear el locker en estado Maintenance', async () => {
        const result = await useCase.execute({
            number: 11,
            location: 'Pasillo Secundario',
            status: 'Maintenance',
        });
    });

    it('CA 4 - Debe lanzar BadRequestError si se intenta crear con estado Occupied', async () => {
        await expect(
          useCase.execute({ number: 12, location: 'Pasillo', status: 'Occupied' as any })
        ).rejects.toThrow(BadRequestError);
    });

    it('CA 5 - Debe lanzar BadRequestError si la ubicación está vacía', async () => {
        await expect(
          useCase.execute({ number: 13, location: '   ' })
        ).rejects.toThrow(BadRequestError);
    });
})