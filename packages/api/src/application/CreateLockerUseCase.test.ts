import { beforeEach, describe, expect, it, vi } from "vitest";
import { LockerRepository } from "../domain/LockerRepository.js";
import { CreateLockerUseCase } from "./CreateLockerUseCase.js";
import { LockerValidator } from "../domain/services/LockerValidator.js";

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

        // Espiamos al validador para comprobar que el UseCase efectivamente lo está llamando
        vi.spyOn(validator, 'validateForCreation');

        // instanciamos el caso de uso con ambas dependencias
        useCase = new CreateLockerUseCase(mockRepo, validator);
    })

    it('Debe delegar la validación de los datos al LockerValidator', async () => {
        await useCase.execute({ number: 10, location: 'Pasillo Principal' });
        expect(validator.validateForCreation).toHaveBeenCalledTimes(1);
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

        expect(result.status).toBe('Maintenance');
    });
})