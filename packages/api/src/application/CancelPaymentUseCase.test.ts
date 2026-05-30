import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CancelPaymentUseCase } from './CancelPaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

describe('CancelPaymentUseCase', () => {
    const mockPaymentRepo = {
        findById: vi.fn(),
        cancel: vi.fn(),
    } as unknown as PaymentRepository;

    const useCase = new CancelPaymentUseCase(mockPaymentRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockPendingPayment: PaymentResponse = {
        id: 'payment-1',
        amount: 150,
        month: 6,
        year: 2026,
        status: 'Pending',
        dueDate: '2026-06-15T00:00:00.000Z',
        paymentDate: null,
        memberId: 'member-1',
    };

    it('Debe cancelar un pago pendiente correctamente', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockPendingPayment);
        vi.mocked(mockPaymentRepo.cancel).mockResolvedValueOnce({ ...mockPendingPayment, status: 'Canceled' });

        const result = await useCase.execute('payment-1');

        expect(mockPaymentRepo.findById).toHaveBeenCalledWith('payment-1');
        expect(mockPaymentRepo.cancel).toHaveBeenCalledWith('payment-1');
        expect(result.status).toBe('Canceled');
    });
});
