import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisciplineController } from './DisciplineController.js';
import { CreateDisciplineRequest, DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared';

describe('DisciplineController', () => {
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockListByMemberUseCase = { execute: vi.fn() };
    const mockGetMemberStatusUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };

    const controller = new DisciplineController(
        mockCreateUseCase as any,
        mockGetUseCase as any,
        mockListByMemberUseCase as any,
        mockGetMemberStatusUseCase as any,
        mockUpdateUseCase as any,
        mockDeleteUseCase as any,
    );

    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
    };

    const validRequest: CreateDisciplineRequest = {
        reason: 'Conducta antideportiva',
        startDate: '2026-05-01',
        endDate: '2026-05-15',
        isTotalSuspension: true,
        memberId: 'member-1',
    };

    const mockRequest = {
        body: validRequest,
    };

    const disciplineId = '11111111-1111-4111-8111-111111111111';
    const updateRequest: UpdateDisciplineRequest = {
        reason: 'Reincidencia disciplinaria',
        isTotalSuspension: false,
    };

    const mockUpdateRequest = {
        params: { id: disciplineId },
        body: updateRequest,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('debe devolver status 201 y la sancion creada si el alta es exitosa', async () => {
            const mockDiscipline: DisciplineDTO = {
                id: 'discipline-1',
                ...validRequest,
            };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockDiscipline);

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockCreateUseCase.execute).toHaveBeenCalledWith(validRequest);
            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockDiscipline });
        });

        it('debe devolver status 400 si faltan campos requeridos', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Faltan campos requeridos'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Faltan campos requeridos' });
        });

        it('debe devolver status 400 si la fecha de fin no es posterior a la de inicio', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(
                new Error('La fecha de fin debe ser posterior a la de inicio'),
            );

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'La fecha de fin debe ser posterior a la de inicio',
            });
        });

        it('debe devolver status 404 si el socio informado no existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(
                new Error('El socio especificado no existe'),
            );

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'El socio especificado no existe',
            });
        });
    });

    describe('update', () => {
        it('debe devolver status 200 y la sancion actualizada si la modificacion es exitosa', async () => {
            const mockDiscipline: DisciplineDTO = {
                id: disciplineId,
                reason: 'Reincidencia disciplinaria',
                startDate: '2026-05-01',
                endDate: '2026-05-15',
                isTotalSuspension: false,
                memberId: 'member-1',
            };
            mockUpdateUseCase.execute.mockResolvedValueOnce(mockDiscipline);

            await controller.update(mockUpdateRequest as any, mockReply as any);

            expect(mockUpdateUseCase.execute).toHaveBeenCalledWith(disciplineId, updateRequest);
            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockDiscipline });
        });

        it('debe devolver status 400 si el id de sancion no es valido', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(
                new Error('El id de la sancion no es valido'),
            );

            await controller.update(mockUpdateRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'El id de la sancion no es valido',
            });
        });

        it('debe devolver status 400 si las fechas actualizadas son invalidas', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(
                new Error('La fecha de fin debe ser posterior a la de inicio'),
            );

            await controller.update(mockUpdateRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'La fecha de fin debe ser posterior a la de inicio',
            });
        });

        it('debe devolver status 404 si la sancion no existe', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('La sancion no existe'));

            await controller.update(mockUpdateRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'La sancion no existe' });
        });
    });
});
