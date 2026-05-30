import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteSportUseCase } from './DeleteSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { SportDTO } from '@alentapp/shared';

describe('DeleteSportUseCase', () => {
    const mockSportRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateSportId: vi.fn(),
    } as unknown as SportValidator;

    const useCase = new DeleteSportUseCase(mockSportRepo, mockSportValidator);

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

    it('debe eliminar un deporte existente sin inscriptos', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(existingSport);
        vi.mocked(mockSportRepo.delete).mockResolvedValueOnce();

        await useCase.execute(sportId);

        expect(mockSportValidator.validateSportId).toHaveBeenCalledWith(sportId);
        expect(mockSportRepo.findById).toHaveBeenCalledWith(sportId);
        expect(mockSportRepo.delete).toHaveBeenCalledWith(sportId);
    });

    it('debe lanzar error si el id informado no es valido', async () => {
        vi.mocked(mockSportValidator.validateSportId).mockImplementationOnce(() => {
            throw new Error('El id informado no es valido');
        });

        await expect(useCase.execute('sport-1')).rejects.toThrow(
            'El id informado no es valido',
        );

        expect(mockSportRepo.findById).not.toHaveBeenCalled();
        expect(mockSportRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el deporte no existe', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(sportId)).rejects.toThrow('El deporte no existe');

        expect(mockSportRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el deporte tiene inscriptos', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce({
            ...existingSport,
            current_enrollment_count: 1,
        });

        await expect(useCase.execute(sportId)).rejects.toThrow(
            'No se puede eliminar un deporte con inscriptos',
        );

        expect(mockSportRepo.delete).not.toHaveBeenCalled();
    });
});
