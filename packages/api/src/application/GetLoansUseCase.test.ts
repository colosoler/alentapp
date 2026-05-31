import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetLoansUseCase } from './GetLoansUseCase.js';
import { LoanRepository } from '../domain/LoanRepository.js';
import { LoanWithMemberDTO } from '@alentapp/shared';

describe('GetLoansUseCase', () => {
    const mockLoanRepo = {
        findAll: vi.fn(),
    } as unknown as LoanRepository;

    const useCase = new GetLoansUseCase(mockLoanRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar la lista de prestamos con datos de socio', async () => {
        const mockLoans: LoanWithMemberDTO[] = [
            {
                id: 'loan-1',
                member_id: '123e4567-e89b-12d3-a456-426614174000',
                item_name: 'Balon de futbol',
                loan_date: '2026-05-28T00:00:00.000Z',
                due_date: '2026-06-15',
                status: 'Loaned',
                member: { name: 'Socio Existente' },
            },
        ];
        vi.mocked(mockLoanRepo.findAll).mockResolvedValueOnce(mockLoans);

        const result = await useCase.execute({});

        expect(mockLoanRepo.findAll).toHaveBeenCalledWith({});
        expect(result).toEqual(mockLoans);
    });

    it('debe retornar array vacio cuando no hay prestamos', async () => {
        vi.mocked(mockLoanRepo.findAll).mockResolvedValueOnce([]);

        const result = await useCase.execute({});

        expect(result).toEqual([]);
    });
});
