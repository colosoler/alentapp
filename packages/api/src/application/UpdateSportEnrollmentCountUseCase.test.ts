import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportDTO } from '@alentapp/shared';
import { UpdateSportEnrollmentCountUseCase } from './UpdateSportEnrollmentCountUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';

describe('UpdateSportEnrollmentCountUseCase', () => {
    const mockSportRepo = {
        findById: vi.fn(),
        updateEnrollmentCount: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateEnrollmentAction: vi.fn(),
    } as unknown as SportValidator;

    const useCase = new UpdateSportEnrollmentCountUseCase(
        mockSportRepo,
        mockSportValidator,
    );

    const sportId = '11111111-1111-4111-8111-111111111111';
    const existingSport: SportDTO = {
        id: sportId,
        name: 'Natacion',
        description: 'Actividad de pileta',
        max_capacity: 10,
        current_enrollment_count: 5,
        additional_price: 1500,
        requires_medical_certificate: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe incrementar la cantidad de inscriptos si hay cupo disponible', async () => {
        const updatedSport = {
            ...existingSport,
            current_enrollment_count: 6,
        };
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);
        vi.mocked(mockSportRepo.updateEnrollmentCount).mockResolvedValueOnce(
            updatedSport,
        );

        const result = await useCase.execute(sportId, { action: 'increment' });

        expect(mockSportValidator.validateEnrollmentAction).toHaveBeenCalledWith(
            'increment',
        );
        expect(mockSportRepo.findById).toHaveBeenCalledWith(sportId);
        expect(mockSportRepo.updateEnrollmentCount).toHaveBeenCalledWith(sportId, 6);
        expect(result).toEqual(updatedSport);
    });

    it('debe decrementar la cantidad de inscriptos si el cupo no queda negativo', async () => {
        const updatedSport = {
            ...existingSport,
            current_enrollment_count: 4,
        };
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);
        vi.mocked(mockSportRepo.updateEnrollmentCount).mockResolvedValueOnce(
            updatedSport,
        );

        const result = await useCase.execute(sportId, { action: 'decrement' });

        expect(mockSportValidator.validateEnrollmentAction).toHaveBeenCalledWith(
            'decrement',
        );
        expect(mockSportRepo.findById).toHaveBeenCalledWith(sportId);
        expect(mockSportRepo.updateEnrollmentCount).toHaveBeenCalledWith(sportId, 4);
        expect(result).toEqual(updatedSport);
    });

    it('debe lanzar error si el deporte no existe', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);

        await expect(
            useCase.execute(sportId, { action: 'increment' }),
        ).rejects.toThrow('El deporte no existe');

        expect(mockSportValidator.validateEnrollmentAction).toHaveBeenCalledWith(
            'increment',
        );
        expect(mockSportRepo.findById).toHaveBeenCalledWith(sportId);
        expect(mockSportRepo.updateEnrollmentCount).not.toHaveBeenCalled();
    });

    it('debe lanzar error si no hay cupo disponible', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce({
            ...existingSport,
            current_enrollment_count: 10,
            max_capacity: 10,
        });

        await expect(
            useCase.execute(sportId, { action: 'increment' }),
        ).rejects.toThrow('No hay cupo disponible');

        expect(mockSportRepo.updateEnrollmentCount).not.toHaveBeenCalled();
    });

    it('debe lanzar error si se intenta decrementar por debajo de cero', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce({
            ...existingSport,
            current_enrollment_count: 0,
        });

        await expect(
            useCase.execute(sportId, { action: 'decrement' }),
        ).rejects.toThrow('No se puede decrementar el cupo por debajo de cero');

        expect(mockSportRepo.updateEnrollmentCount).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la accion de cupo no es valida', async () => {
        vi.mocked(mockSportValidator.validateEnrollmentAction).mockImplementationOnce(
            () => {
                throw new Error('Accion de cupo invalida');
            },
        );

        await expect(
            useCase.execute(sportId, { action: 'invalid' as never }),
        ).rejects.toThrow('Accion de cupo invalida');

        expect(mockSportRepo.findById).not.toHaveBeenCalled();
        expect(mockSportRepo.updateEnrollmentCount).not.toHaveBeenCalled();
    });
});
