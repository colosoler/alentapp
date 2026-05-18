import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

export class CancelPaymentUseCase {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    async execute(id: string): Promise<PaymentResponse> {
        const existingPayment = await this.paymentRepo.findById(id);

        if (!existingPayment) {
            throw new Error('El pago especificado no existe');
        }

        if (existingPayment.status === 'Canceled') {
            throw new Error('El pago ya se encuentra cancelado');
        }

        const canceledPayment = await this.paymentRepo.cancel(id);

        return canceledPayment;
    }
}