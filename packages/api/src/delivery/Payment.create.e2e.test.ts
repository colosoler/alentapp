import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Pruebas E2E de Creación de Pagos', () => {
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

    it('Debe crear un socio y un pago en la base de datos real', async () => {
        const memberResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/socios',
            payload: {
                name: 'Payment E2E',
                dni: testDni,
                email: testEmail,
                birthdate: '2000-01-01',
                category: 'Pleno',
            },
        });

        expect(memberResponse.statusCode).toBe(201);
        createdMemberId = JSON.parse(memberResponse.payload).data.id;

        const paymentResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/payments',
            payload: {
                amount: 250,
                month: 6,
                year: 2026,
                dueDate: '2026-06-15',
                memberId: createdMemberId,
            },
        });

        expect(paymentResponse.statusCode).toBe(201);
        const body = JSON.parse(paymentResponse.payload);
        expect(body.data.status).toBe('Pending');
        expect(body.data.amount).toBe(250);

        createdPaymentId = body.data.id;

        const dbPayment = await prisma.payment.findUnique({ where: { id: createdPaymentId } });
        expect(dbPayment).not.toBeNull();
        expect(dbPayment?.amount).toBe(250);
        expect(dbPayment?.status).toBe('Pending');
    });
});
