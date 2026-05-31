import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSportByIdUseCase } from './GetSportByIdUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO } from '@alentapp/shared';

describe('GetSportByIdUseCase', () => {
    const mockSportRepo = {
        findById: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateSportId: vi.fn(),
    } as unknown as SportValidator;

    const useCase = new GetSportByIdUseCase(mockSportRepo, mockSportValidator);

    const sportId = '11111111-1111-4111-8111-111111111111';
    const existingSport: SportDTO = {
        id: sportId,
        name: 'Natacion',
        description: 'Actividad de pileta',
        max_capacity: 20,
        current_enrollment_count: 0,
        additional_price: 1500,
        requires_medical_certificate: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar un deporte existente por id', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);

        const result = await useCase.execute(sportId);

        expect(mockSportValidator.validateSportId).toHaveBeenCalledWith(sportId);
        expect(mockSportRepo.findById).toHaveBeenCalledWith(sportId);
        expect(result).toEqual(existingSport);
    });

    it('debe lanzar error si el id informado no es valido', async () => {
        vi.mocked(mockSportValidator.validateSportId).mockImplementationOnce(() => {
            throw new Error('El id informado no es valido');
        });

        await expect(useCase.execute('sport-1')).rejects.toThrow(
            'El id informado no es valido',
        );

        expect(mockSportRepo.findById).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el deporte no existe', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(sportId)).rejects.toThrow('El deporte no existe');

        expect(mockSportValidator.validateSportId).toHaveBeenCalledWith(sportId);
        expect(mockSportRepo.findById).toHaveBeenCalledWith(sportId);
    });
});
