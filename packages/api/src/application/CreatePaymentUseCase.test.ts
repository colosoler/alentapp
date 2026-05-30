import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePaymentUseCase } from './CreatePaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';
import { CreatePaymentRequest, PaymentResponse } from '@alentapp/shared';

describe('CreatePaymentUseCase', () => {
    const mockPaymentRepo = {
        create: vi.fn(),
    } as unknown as PaymentRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockValidator = {
        validateRequiredFields: vi.fn(),
        validateAmount: vi.fn(),
        validateMonth: vi.fn(),
        validateYear: vi.fn(),
        validateDueDate: vi.fn(),
    } as unknown as PaymentValidator;

    const useCase = new CreatePaymentUseCase(
        mockPaymentRepo,
        mockMemberRepo,
        mockValidator,
    );

    const validRequest: CreatePaymentRequest = {
        amount: 150,
        month: 6,
        year: 2026,
        dueDate: '2026-06-15',
        memberId: 'member-uuid-1',
    };

    const mockCreatedPayment: PaymentResponse = {
        id: 'payment-uuid-1',
        amount: 150,
        month: 6,
        year: 2026,
        status: 'Pending',
        dueDate: '2026-06-15T00:00:00.000Z',
        paymentDate: null,
        memberId: 'member-uuid-1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockMemberRepo.findById).mockResolvedValue({
            id: 'member-uuid-1',
        } as any);
        vi.mocked(mockPaymentRepo.create).mockResolvedValue(mockCreatedPayment);
    });

    it('Debe crear un pago cuando el socio existe y la validación pasa', async () => {
        const result = await useCase.execute(validRequest);

        expect(mockValidator.validateRequiredFields).toHaveBeenCalledWith(validRequest);
        expect(mockValidator.validateAmount).toHaveBeenCalledWith(150);
        expect(mockValidator.validateMonth).toHaveBeenCalledWith(6);
        expect(mockValidator.validateYear).toHaveBeenCalledWith(2026);
        expect(mockValidator.validateDueDate).toHaveBeenCalledWith('2026-06-15');
        expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-uuid-1');
        expect(mockPaymentRepo.create).toHaveBeenCalledWith(validRequest);
        expect(result).toEqual(mockCreatedPayment);
    });
});