import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentResponse, UpdatePaymentRequest } from '@alentapp/shared';

export class UpdatePaymentUseCase {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    async execute(id: string, data: UpdatePaymentRequest): Promise<PaymentResponse> {
        const existingPayment = await this.paymentRepo.findById(id);

        if (!existingPayment) {
            throw new Error('El pago especificado no existe');
        }

        if (data.status !== undefined) {
            if (data.status === 'Canceled') {
                throw new Error('Use el endpoint de cancelación');
            }

            if (existingPayment.status === 'Canceled') {
                throw new Error('No se puede pagar un pago cancelado');
            }

            if (existingPayment.status === 'Paid' && data.status === 'Paid') {
            } else if (existingPayment.status !== 'Pending' && data.status === 'Paid') {
                throw new Error('Solo se pueden marcar como pagados los pagos en estado Pendiente');
            }
        }

        if (data.amount !== undefined) {
            if (!Number.isFinite(data.amount) || data.amount <= 0) {
                throw new Error('El monto debe ser mayor a cero');
            }
        }

        if (data.month !== undefined) {
            if (!Number.isInteger(data.month) || data.month < 1 || data.month > 12) {
                throw new Error('El mes debe estar entre 1 y 12');
            }
        }

        if (data.year !== undefined) {
            if (!Number.isInteger(data.year) || data.year <= 2000) {
                throw new Error('El año ingresado no es válido');
            }
        }

        const updatedPayment = await this.paymentRepo.update(id, data);

        return updatedPayment;
    }
}