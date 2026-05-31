import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { CreateLoanRequest } from '@alentapp/shared';

/**
 * Tests E2E para la creacion de Prestamos (Loan).
 * NO hay mocks: la app entera se levanta con buildApp() y golpea
 * la PostgreSQL real de test (alentapp_test_db) via DATABASE_URL.
 *
 * Como equipmentLoan.member_id es una FK obligatoria, en beforeAll
 * creamos un socio real que sirve de precondicion para el prestamo.
 */
describe('Loan API End-to-End Tests (Create)', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let memberId: string;
    let createdLoanId: string;

    const randomSuffix = Math.floor(Math.random() * 100000).toString();

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        const member = await prisma.member.create({
            data: {
                dni: `E2E${randomSuffix}`,
                name: 'Socio Loan E2E',
                email: `loan.e2e.${randomSuffix}@test.com`,
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',
            },
        });
        memberId = member.id;
    });

    afterAll(async () => {
        if (createdLoanId) {
            await prisma.equipmentLoan.deleteMany({ where: { id: createdLoanId } });
        }
        await prisma.member.deleteMany({ where: { id: memberId } });
        await prisma.$disconnect();
        await app.close();
    });

    it('POST: debe crear un prestamo real en la base de datos', async () => {
        const payload: CreateLoanRequest = {
            member_id: memberId,
            item_name: 'Balon de futbol',
            due_date: '2026-06-15',
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/equipment-loan',
            payload,
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);

        expect(body.data.id).toBeDefined();
        expect(body.data.item_name).toBe('Balon de futbol');
        expect(body.data.status).toBe('Loaned');
        expect(body.data.member_id).toBe(memberId);

        createdLoanId = body.data.id;

        const dbLoan = await prisma.equipmentLoan.findUnique({
            where: { id: createdLoanId },
        });
        expect(dbLoan).not.toBeNull();
        expect(dbLoan?.item_name).toBe('Balon de futbol');
        expect(dbLoan?.status).toBe('Loaned');
        expect(dbLoan?.member_id).toBe(memberId);
    });
});
