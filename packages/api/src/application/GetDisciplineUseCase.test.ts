import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDisciplineUseCase } from './GetDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { DisciplineDTO } from '@alentapp/shared';

describe('GetDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        findById: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockDisciplineValidator = {
        validateReportedId: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new GetDisciplineUseCase(mockDisciplineRepo, mockDisciplineValidator);

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

    it('debe retornar una sancion existente por id', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(existingDiscipline);

        const result = await useCase.execute(disciplineId);

        expect(mockDisciplineValidator.validateReportedId).toHaveBeenCalledWith(disciplineId);
        expect(mockDisciplineRepo.findById).toHaveBeenCalledWith(disciplineId);
        expect(result).toEqual(existingDiscipline);
    });

    it('debe lanzar error si el id informado no es valido', async () => {
        vi.mocked(mockDisciplineValidator.validateReportedId).mockImplementationOnce(() => {
            throw new Error('El id informado no es valido');
        });

        await expect(useCase.execute('discipline-1')).rejects.toThrow(
            'El id informado no es valido',
        );

        expect(mockDisciplineRepo.findById).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la sancion no existe', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(disciplineId)).rejects.toThrow('La sancion no existe');
    });
});
