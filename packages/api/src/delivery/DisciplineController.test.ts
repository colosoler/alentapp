import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisciplineController } from './DisciplineController.js';
import { CreateDisciplineRequest, DisciplineDTO } from '@alentapp/shared';

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
});
