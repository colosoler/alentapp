import { CreatePaymentRequest, GetPaymentsQuery, PaymentResponse, UpdatePaymentRequest } from '@alentapp/shared';

export interface PaymentRepository {
    create(payment: CreatePaymentRequest): Promise<PaymentResponse>;
    findAll(query: GetPaymentsQuery): Promise<PaymentResponse[]>;
    findById(id: string): Promise<PaymentResponse | null>;
    update(id: string, data: UpdatePaymentRequest): Promise<PaymentResponse>;
    cancel(id: string): Promise<PaymentResponse>;
}
