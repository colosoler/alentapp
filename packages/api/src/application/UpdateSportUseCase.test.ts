import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SportDTO, UpdateSportRequest } from '@alentapp/shared';
import { UpdateSportUseCase } from './UpdateSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';

describe('UpdateSportUseCase', () => {
    const mockSportRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateDescription: vi.fn(),
        validateMaxCapacity: vi.fn(),
    } as unknown as SportValidator;

    const useCase = new UpdateSportUseCase(mockSportRepo, mockSportValidator);

    const sportId = 'sport-1';
    const existingSport: SportDTO = {
        id: sportId,
        name: 'Natacion',
        description: 'Actividad de pileta para todas las edades',
        max_capacity: 20,
        current_enrollment_count: 5,
        additional_price: 1500,
        requires_medical_certificate: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockSportRepo.findById).mockResolvedValue(existingSport);
    });

    it('debe actualizar descripcion y capacidad maxima de un deporte existente', async () => {
        const updateData: UpdateSportRequest = {
            description: 'Entrenamiento avanzado en pileta',
            max_capacity: 25,
        };
        const updatedSport = {
            ...existingSport,
            ...updateData,
        };
        vi.mocked(mockSportRepo.update).mockResolvedValueOnce(updatedSport);

        const result = await useCase.execute(sportId, updateData);

        expect(mockSportRepo.findById).toHaveBeenCalledWith(sportId);
        expect(mockSportValidator.validateDescription).toHaveBeenCalledWith(
            updateData.description,
        );
        expect(mockSportValidator.validateMaxCapacity).toHaveBeenCalledWith(
            updateData.max_capacity,
        );
        expect(mockSportRepo.update).toHaveBeenCalledWith(sportId, updateData);
        expect(result).toEqual(updatedSport);
    });

    it('debe lanzar error si el deporte no existe', async () => {
        vi.mocked(mockSportRepo.findById).mockResolvedValueOnce(null);

        await expect(
            useCase.execute(sportId, { description: 'Nueva descripcion' }),
        ).rejects.toThrow('El deporte no existe');

        expect(mockSportRepo.update).not.toHaveBeenCalled();
    });

    it('no debe actualizar si la capacidad maxima es menor que los inscriptos actuales', async () => {
        await expect(
            useCase.execute(sportId, { max_capacity: 4 }),
        ).rejects.toThrow('No hay cupo disponible');

        expect(mockSportValidator.validateMaxCapacity).toHaveBeenCalledWith(4);
        expect(mockSportRepo.update).not.toHaveBeenCalled();
    });

    it('no debe actualizar si la descripcion enviada no es valida', async () => {
        vi.mocked(mockSportValidator.validateDescription).mockImplementationOnce(() => {
            throw new Error('La descripcion del deporte es obligatoria');
        });

        await expect(
            useCase.execute(sportId, { description: '   ' }),
        ).rejects.toThrow('La descripcion del deporte es obligatoria');

        expect(mockSportRepo.update).not.toHaveBeenCalled();
    });
});
