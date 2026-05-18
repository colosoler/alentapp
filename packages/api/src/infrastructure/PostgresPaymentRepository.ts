import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { CreatePaymentRequest, GetPaymentsQuery, PaymentResponse, UpdatePaymentRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBPayment = {
    id: string;
    amount: number;
    month: number;
    year: number;
    status: 'Pending' | 'Paid' | 'Canceled';
    due_date: Date;
    payment_date: Date | null;
    created_at: Date;
    member_id: string;
};

export class PostgresPaymentRepository implements PaymentRepository {
    async create(data: CreatePaymentRequest): Promise<PaymentResponse> {
        const payment = await prisma.payment.create({
            data: {
                amount: data.amount,
                month: data.month,
                year: data.year,
                due_date: new Date(data.dueDate),
                member_id: data.memberId,
            },
        });

        return this.mapToDTO(payment);
    }

    async findAll(query: GetPaymentsQuery): Promise<PaymentResponse[]> {
        const where: any = {};

        if (query.memberId) {
            where.member_id = query.memberId;
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.month !== undefined) {
            where.month = Number(query.month);
        }

        if (query.year !== undefined) {
            where.year = Number(query.year);
        }

        const payments = await prisma.payment.findMany({
            where,
            orderBy: { created_at: 'desc' },
        });

        return payments.map(this.mapToDTO);
    }

    async findById(id: string): Promise<PaymentResponse | null> {
        const payment = await prisma.payment.findUnique({
            where: { id },
        });

        if (!payment) {
            return null;
        }

        return this.mapToDTO(payment);
    }

    async update(id: string, data: UpdatePaymentRequest): Promise<PaymentResponse> {
        const updateData: any = {};

        if (data.amount !== undefined) {
            updateData.amount = data.amount;
        }

        if (data.month !== undefined) {
            updateData.month = data.month;
        }

        if (data.year !== undefined) {
            updateData.year = data.year;
        }

        if (data.dueDate !== undefined) {
            updateData.due_date = new Date(data.dueDate);
        }

        if (data.paymentDate !== undefined) {
            updateData.payment_date = data.paymentDate ? new Date(data.paymentDate) : null;
        }

        if (data.status !== undefined) {
            updateData.status = data.status;
            if (data.status === 'Paid') {
                updateData.payment_date = new Date();
            }
        }

        const payment = await prisma.payment.update({
            where: { id },
            data: updateData,
        });

        return this.mapToDTO(payment);
    }

    async cancel(id: string): Promise<PaymentResponse> {
        const payment = await prisma.payment.update({
            where: { id },
            data: { status: 'Canceled' },
        });

        return this.mapToDTO(payment);
    }

    private mapToDTO(payment: DBPayment): PaymentResponse {
        return {
            id: payment.id,
            amount: payment.amount,
            month: payment.month,
            year: payment.year,
            status: payment.status,
            dueDate: payment.due_date.toISOString(),
            paymentDate: payment.payment_date ? payment.payment_date.toISOString() : null,
            memberId: payment.member_id,
        };
    }
}
