import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Pruebas E2E de Actualización de Pagos', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdMemberId: string;
    let createdPaymentId: string;

    const randomSuffix = Math.floor(Math.random() * 100000).toString();
    const testDni = `E2E${randomSuffix}`;
    const testEmail = `e2e${randomSuffix}@test.com`;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        const memberResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/socios',
            payload: {
                name: 'Pago E2E Actualizar',
                dni: testDni,
                email: testEmail,
                birthdate: '2000-01-01',
                category: 'Pleno',
            },
        });

        createdMemberId = JSON.parse(memberResponse.payload).data.id;

        const paymentResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/payments',
            payload: {
                amount: 300,
                month: 8,
                year: 2026,
                dueDate: '2026-08-15',
                memberId: createdMemberId,
            },
        });

        createdPaymentId = JSON.parse(paymentResponse.payload).data.id;
    });

    afterAll(async () => {
        if (createdPaymentId) {
            await prisma.payment.deleteMany({ where: { id: createdPaymentId } });
        }
        if (createdMemberId) {
            await prisma.member.deleteMany({ where: { id: createdMemberId } });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('Debe actualizar el pago a Pagado en la base de datos real', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/payments/${createdPaymentId}`,
            payload: { status: 'Paid' },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.status).toBe('Paid');
        expect(body.data.paymentDate).not.toBeNull();

        const dbPayment = await prisma.payment.findUnique({ where: { id: createdPaymentId } });
        expect(dbPayment).not.toBeNull();
        expect(dbPayment?.status).toBe('Paid');
        expect(dbPayment?.payment_date).not.toBeNull();
    });
});
