import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateLoanUseCase } from './CreateLoanUseCase.js';
import { LoanRepository } from '../domain/LoanRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { LoanValidator } from '../domain/services/LoanValidator.js';
import { CreateLoanRequest, LoanDTO, MemberDTO } from '@alentapp/shared';

describe('CreateLoanUseCase', () => {
    const mockLoanRepo = {
        create: vi.fn(),
    } as unknown as LoanRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockLoanValidator = {
        validateRequiredFields: vi.fn(),
        validateMemberId: vi.fn(),
        validateItemName: vi.fn(),
        validateDueDate: vi.fn(),
    } as unknown as LoanValidator;

    const useCase = new CreateLoanUseCase(
        mockLoanRepo,
        mockMemberRepo,
        mockLoanValidator,
    );

    const validRequest: CreateLoanRequest = {
        member_id: '123e4567-e89b-12d3-a456-426614174000',
        item_name: 'Balon de futbol',
        due_date: '2026-06-15',
    };

    const existingMember = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Socio Existente',
        category: 'Pleno',
    } as MemberDTO;

    const createdLoan: LoanDTO = {
        id: 'loan-1',
        member_id: validRequest.member_id,
        item_name: validRequest.item_name,
        loan_date: '2026-05-28T00:00:00.000Z',
        due_date: validRequest.due_date,
        status: 'Loaned',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un prestamo si los datos son validos y el socio existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(existingMember);
        vi.mocked(mockLoanRepo.create).mockResolvedValueOnce(createdLoan);

        const result = await useCase.execute(validRequest);

        expect(mockLoanValidator.validateRequiredFields).toHaveBeenCalledWith(validRequest);
        expect(mockLoanValidator.validateMemberId).toHaveBeenCalledWith(validRequest.member_id);
        expect(mockLoanValidator.validateItemName).toHaveBeenCalledWith(validRequest.item_name);
        expect(mockMemberRepo.findById).toHaveBeenCalledWith(validRequest.member_id);
        expect(mockLoanRepo.create).toHaveBeenCalledWith(validRequest);
        expect(result).toEqual(createdLoan);
    });

    it('debe lanzar error si el socio informado es Cadete', async () => {
        const cadeteMember = { ...existingMember, category: 'Cadete' };
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(cadeteMember);

        await expect(useCase.execute(validRequest)).rejects.toThrow(
            'Los socios Cadetes tienen prohibido solicitar material',
        );

        expect(mockLoanRepo.create).not.toHaveBeenCalled();
    });
});
