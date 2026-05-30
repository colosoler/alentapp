import { describe, it, expect, vi } from 'vitest';
import { UpdatePaymentUseCase } from './UpdatePaymentUseCase.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

describe('UpdatePaymentUseCase', () => {
    const mockPaymentRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as PaymentRepository;

    const useCase = new UpdatePaymentUseCase(mockPaymentRepo);

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

    vi.mocked(mockPaymentRepo.findById).mockResolvedValue(mockPendingPayment);

    it('Debe dar error si el pago no existe', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('payment-999', { amount: 200 })).rejects.toThrow('El pago especificado no existe');
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

    it('Debe rechazar el uso del status Canceled (usar endpoint de cancelación)', async () => {
        await expect(useCase.execute('payment-1', { status: 'Canceled' as any })).rejects.toThrow('Use el endpoint de cancelación');
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

    it('Debe dar error al intentar pagar un pago cancelado', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({ ...mockPendingPayment, status: 'Canceled' });
        await expect(useCase.execute('payment-1', { status: 'Paid' })).rejects.toThrow('No se puede pagar un pago cancelado');
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

        it('Debe actualizar el monto y el mes correctamente', async () => {
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce({
            ...mockPendingPayment,
            amount: 200,
            month: 7,
        });

        const result = await useCase.execute('payment-1', { amount: 200, month: 7 });

        expect(mockPaymentRepo.update).toHaveBeenCalledWith('payment-1', { amount: 200, month: 7 });
        expect(result.amount).toBe(200);
        expect(result.month).toBe(7);
    });
});
