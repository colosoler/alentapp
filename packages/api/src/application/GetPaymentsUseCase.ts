import { PaymentRepository } from '../domain/PaymentRepository.js';
import { GetPaymentsQuery, PaymentResponse } from '@alentapp/shared';

export class GetPaymentsUseCase {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    async execute(query: GetPaymentsQuery): Promise<PaymentResponse[]> {
        return this.paymentRepo.findAll(query);
    }
}