import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Loan API End-to-End Tests (Update Status)', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let memberId: string;
    let loanId: string;

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
                dni: `E2EUPD${randomSuffix}`,
                name: 'Socio Loan Update E2E',
                email: `loan.update.e2e.${randomSuffix}@test.com`,
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',
            },
        });
        memberId = member.id;

        const loan = await prisma.equipmentLoan.create({
            data: {
                member_id: memberId,
                item_name: 'Balon de futbol',
                loan_date: new Date(),
                due_date: new Date('2026-06-15'),
                status: 'Loaned',
            },
        });
        loanId = loan.id;
    });

    afterAll(async () => {
        if (loanId) {
            await prisma.equipmentLoan.deleteMany({ where: { id: loanId } });
        }
        if (memberId) {
            await prisma.member.deleteMany({ where: { id: memberId } });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('PATCH: debe actualizar el estado del prestamo a Returned en la base de datos', async () => {
        const response = await app.inject({
            method: 'PATCH',
            url: `/api/v1/equipment-loan/${loanId}/status`,
            payload: { status: 'Returned' },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.status).toBe('Returned');

        const dbLoan = await prisma.equipmentLoan.findUnique({
            where: { id: loanId },
        });
        expect(dbLoan?.status).toBe('Returned');
    });
});
