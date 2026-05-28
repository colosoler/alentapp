import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoanController } from './LoanController.js';
import { CreateLoanRequest, LoanDTO } from '@alentapp/shared';

describe('LoanController', () => {
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetAllUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };
    const mockUpdateStatusUseCase = { execute: vi.fn() };

    const controller = new LoanController(
        mockCreateUseCase as any,
        mockGetAllUseCase as any,
        mockDeleteUseCase as any,
        mockUpdateStatusUseCase as any,
    );

    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // === CREATE LOAN ===

    describe('create - Create Loan', () => {
        const validRequest: CreateLoanRequest = {
            member_id: '123e4567-e89b-12d3-a456-426614174000',
            item_name: 'Balon de futbol',
            due_date: '2026-06-15',
        };

        const mockRequest = {
            body: validRequest,
        };

        it('debe devolver status 201 y el prestamo creado si el alta es exitosa', async () => {
            const mockLoan: LoanDTO = {
                id: 'loan-1',
                ...validRequest,
                loan_date: '2026-05-28T00:00:00.000Z',
                status: 'Loaned',
            };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockLoan);

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockCreateUseCase.execute).toHaveBeenCalledWith(validRequest);
            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockLoan });
        });

        it('debe devolver status 403 si el socio es Cadete', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(
                new Error('Los socios Cadetes tienen prohibido solicitar material'),
            );

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(403);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: 'Los socios Cadetes tienen prohibido solicitar material',
            });
        });
    });
});
