import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { CreateLoanRequest } from '@alentapp/shared';

describe('Loan API End-to-End Tests (List)', () => {
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
                dni: `E2ELIST${randomSuffix}`,
                name: 'Socio Loan List E2E',
                email: `loan.list.e2e.${randomSuffix}@test.com`,
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

    it('GET: debe retornar la lista de prestamos reales desde la base de datos', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/equipment-loan',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(Array.isArray(body.data)).toBe(true);

        const found = body.data.find((loan: any) => loan.id === loanId);
        expect(found).toBeDefined();
        expect(found.item_name).toBe('Balon de futbol');
        expect(found.status).toBe('Loaned');
        expect(found.member.name).toBe('Socio Loan List E2E');
    });
});
