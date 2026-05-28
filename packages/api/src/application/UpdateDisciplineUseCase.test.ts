import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateDisciplineUseCase } from './UpdateDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared';

describe('UpdateDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockDisciplineValidator = {
        validateDisciplineId: vi.fn(),
        validateReason: vi.fn(),
        validateDates: vi.fn(),
        validateTotalSuspension: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new UpdateDisciplineUseCase(mockDisciplineRepo, mockDisciplineValidator);

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
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValue(existingDiscipline);
    });

    it('debe actualizar una sancion existente y validar los datos finales', async () => {
        const updateData: UpdateDisciplineRequest = {
            reason: 'Reincidencia disciplinaria',
            isTotalSuspension: false,
        };
        const updatedDiscipline = {
            ...existingDiscipline,
            ...updateData,
        };
        vi.mocked(mockDisciplineRepo.update).mockResolvedValueOnce(updatedDiscipline);

        const result = await useCase.execute(disciplineId, updateData);

        expect(mockDisciplineValidator.validateDisciplineId).toHaveBeenCalledWith(disciplineId);
        expect(mockDisciplineValidator.validateReason).toHaveBeenCalledWith(
            'Reincidencia disciplinaria',
        );
        expect(mockDisciplineValidator.validateDates).toHaveBeenCalledWith(
            existingDiscipline.startDate,
            existingDiscipline.endDate,
        );
        expect(mockDisciplineValidator.validateTotalSuspension).toHaveBeenCalledWith(false);
        expect(mockDisciplineRepo.update).toHaveBeenCalledWith(disciplineId, updateData);
        expect(result).toEqual(updatedDiscipline);
    });

    it('debe combinar fechas existentes y nuevas antes de validar', async () => {
        const updateData: UpdateDisciplineRequest = {
            endDate: '2026-05-30',
        };
        vi.mocked(mockDisciplineRepo.update).mockResolvedValueOnce({
            ...existingDiscipline,
            ...updateData,
        });

        await useCase.execute(disciplineId, updateData);

        expect(mockDisciplineValidator.validateDates).toHaveBeenCalledWith(
            existingDiscipline.startDate,
            '2026-05-30',
        );
        expect(mockDisciplineRepo.update).toHaveBeenCalledWith(disciplineId, updateData);
    });

    it('debe lanzar error si el id de sancion no es valido', async () => {
        vi.mocked(mockDisciplineValidator.validateDisciplineId).mockImplementationOnce(() => {
            throw new Error('El id de la sancion no es valido');
        });

        await expect(useCase.execute('discipline-1', { reason: 'Nuevo motivo' })).rejects.toThrow(
            'El id de la sancion no es valido',
        );

        expect(mockDisciplineRepo.findById).not.toHaveBeenCalled();
        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si la sancion no existe', async () => {
        vi.mocked(mockDisciplineRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(disciplineId, { reason: 'Nuevo motivo' })).rejects.toThrow(
            'La sancion no existe',
        );

        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('no debe actualizar si el motivo final es invalido', async () => {
        vi.mocked(mockDisciplineValidator.validateReason).mockImplementationOnce(() => {
            throw new Error('El motivo de la sancion es obligatorio');
        });

        await expect(useCase.execute(disciplineId, { reason: '   ' })).rejects.toThrow(
            'El motivo de la sancion es obligatorio',
        );

        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });

    it('no debe actualizar si isTotalSuspension no es booleano', async () => {
        vi.mocked(mockDisciplineValidator.validateTotalSuspension).mockImplementationOnce(() => {
            throw new Error('Faltan campos requeridos');
        });

        await expect(
            useCase.execute(disciplineId, { isTotalSuspension: 'true' as any }),
        ).rejects.toThrow('Faltan campos requeridos');

        expect(mockDisciplineRepo.update).not.toHaveBeenCalled();
    });
});
