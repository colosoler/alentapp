import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteDisciplineUseCase } from './DeleteDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('DeleteDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockDisciplineValidator = {
        validateDisciplineId: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new DeleteDisciplineUseCase(mockDisciplineRepo, mockDisciplineValidator);

    const disciplineId = '11111111-1111-4111-8111-111111111111';
    const existingDiscipline: DisciplineDTO = {
        id: disciplineId,
        reason: 'Conducta antideportiva',
        startDate: '2026-05-01',
        endDate: '2026-05-15',
        isTotalSuspension: true,
        memberId: 'member-1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe eliminar una sancion existente', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(existingDiscipline);
        vi.mocked(mockDisciplineRepo.delete).mockResolvedValueOnce(undefined);

        await useCase.execute(disciplineId);

        expect(mockDisciplineValidator.validateDisciplineId).toHaveBeenCalledWith(disciplineId);
        expect(mockDisciplineRepo.findById).toHaveBeenCalledWith(disciplineId);
        expect(mockDisciplineRepo.delete).toHaveBeenCalledWith(disciplineId);
    });

    it('debe lanzar error si el id de sancion no es valido', async () => {
        vi.mocked(mockDisciplineValidator.validateDisciplineId).mockImplementationOnce(() => {
            throw new Error('El id de la sancion no es valido');
        });

        await expect(useCase.execute('discipline-1')).rejects.toThrow(
            'El id de la sancion no es valido',
        );

        expect(mockDisciplineRepo.findById).not.toHaveBeenCalled();
        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la sancion no existe', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(disciplineId)).rejects.toThrow('La sancion no existe');

        expect(mockDisciplineRepo.delete).not.toHaveBeenCalled();
    });
});
