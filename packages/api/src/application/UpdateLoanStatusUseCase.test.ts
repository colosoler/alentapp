import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateLoanStatusUseCase } from './UpdateLoanStatusUseCase.js';
import { LoanRepository } from '../domain/LoanRepository.js';
import { LoanDTO, UpdateLoanStatusRequest } from '@alentapp/shared';

describe('UpdateLoanStatusUseCase', () => {
    const mockLoanRepo = {
        findById: vi.fn(),
        updateStatus: vi.fn(),
    } as unknown as LoanRepository;

    const useCase = new UpdateLoanStatusUseCase(mockLoanRepo);

    const existingLoan: LoanDTO = {
        id: 'loan-1',
        member_id: '123e4567-e89b-12d3-a456-426614174000',
        item_name: 'Balon de futbol',
        loan_date: '2026-05-28T00:00:00.000Z',
        due_date: '2026-06-15',
        status: 'Loaned',
    };

    const updatedLoan: LoanDTO = {
        ...existingLoan,
        status: 'Returned',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe actualizar el estado del prestamo si es valido', async () => {
        vi.mocked(mockLoanRepo.findById).mockResolvedValueOnce(existingLoan);
        vi.mocked(mockLoanRepo.updateStatus).mockResolvedValueOnce(updatedLoan);

        const result = await useCase.execute('loan-1', { status: 'Returned' });

        expect(mockLoanRepo.findById).toHaveBeenCalledWith('loan-1');
        expect(mockLoanRepo.updateStatus).toHaveBeenCalledWith('loan-1', { status: 'Returned' });
        expect(result).toEqual(updatedLoan);
    });

    it('debe lanzar error si el prestamo ya fue devuelto', async () => {
        const returnedLoan = { ...existingLoan, status: 'Returned' as const };
        vi.mocked(mockLoanRepo.findById).mockResolvedValueOnce(returnedLoan);

        await expect(useCase.execute('loan-1', { status: 'Returned' })).rejects.toThrow(
            'El préstamo ya fue marcado como devuelto anteriormente',
        );

        expect(mockLoanRepo.updateStatus).not.toHaveBeenCalled();
    });
});
