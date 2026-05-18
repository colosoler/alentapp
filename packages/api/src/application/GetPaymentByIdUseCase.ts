import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

export class GetPaymentByIdUseCase {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    async execute(id: string): Promise<PaymentResponse> {
        const payment = await this.paymentRepo.findById(id);
        
        if (!payment) {
            throw new Error('El pago especificado no existe');
        }
        
        return payment;
    }
}