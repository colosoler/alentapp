import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { CreateDisciplineRequest } from '@alentapp/shared';

/**
 * Tests E2E para la creacion de Sanciones (Discipline).
 * NO hay mocks: la app entera se levanta con buildApp() y golpea
 * la PostgreSQL real de test (alentapp_test_db) via DATABASE_URL.
 *
 * Como discipline.member_id es una FK obligatoria, en beforeAll
 * creamos un socio real que sirve de precondicion para la sancion.
 */
describe('Discipline API End-to-End Tests (Create)', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let memberId: string;
    let createdDisciplineId: string;

    // Sufijo aleatorio para no colisionar con datos existentes en la DB.
    const randomSuffix = Math.floor(Math.random() * 100000).toString();

    beforeAll(async () => {
        // 1. Levantamos la app completa (rutas + controller + use cases + repos reales)
        app = buildApp();
        await app.ready();

        // 2. Prisma independiente para preparar la precondicion y verificar la DB
        prisma = new PrismaClient({
            adapter: new PrismaPg(process.env.DATABASE_URL as any),
        });
        await prisma.$connect();

        // 3. Precondicion: un socio real al que asociar la sancion
        const member = await prisma.member.create({
            data: {
                dni: `E2E${randomSuffix}`,
                name: 'Socio Discipline E2E',
                email: `discipline.e2e.${randomSuffix}@test.com`,
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',
            },
        });
        memberId = member.id;
    });

    afterAll(async () => {
        // Tear down: borrar el socio elimina en cascada sus sanciones,
        // pero borramos la sancion explicitamente por claridad.
        if (createdDisciplineId) {
            await prisma.discipline.deleteMany({ where: { id: createdDisciplineId } });
        }
        await prisma.member.deleteMany({ where: { id: memberId } });
        await prisma.$disconnect();
        await app.close();
    });

    it('POST: debe crear una sancion real en la base de datos', async () => {
        const payload: CreateDisciplineRequest = {
            reason: 'Conducta antideportiva',
            startDate: '2026-05-01',
            endDate: '2026-05-15',
            isTotalSuspension: true,
            memberId,
        };

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload,
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);

        expect(body.data.id).toBeDefined();
        expect(body.data.reason).toBe('Conducta antideportiva');
        expect(body.data.isTotalSuspension).toBe(true);
        expect(body.data.memberId).toBe(memberId);

        // Guardamos el ID para limpiar la DB en el afterAll
        createdDisciplineId = body.data.id;

        // Verificacion directa E2E: la sancion existe realmente en PostgreSQL
        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: createdDisciplineId },
        });
        expect(dbDiscipline).not.toBeNull();
        expect(dbDiscipline?.reason).toBe('Conducta antideportiva');
        expect(dbDiscipline?.is_total_suspension).toBe(true);
        expect(dbDiscipline?.member_id).toBe(memberId);
    });

    it('POST: debe fallar con 400 si falta un campo requerido', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload: {
                reason: 'Sancion incompleta',
                memberId,
            },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('Faltan campos requeridos');
    });

    it('POST: debe fallar con 400 si la fecha de fin no es posterior a la de inicio', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload: {
                reason: 'Fechas invertidas',
                startDate: '2026-05-15',
                endDate: '2026-05-01',
                isTotalSuspension: true,
                memberId,
            },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('La fecha de fin debe ser posterior a la de inicio');
    });

    it('POST: debe fallar con 404 si el socio informado no existe', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/disciplines',
            payload: {
                reason: 'Socio fantasma',
                startDate: '2026-05-01',
                endDate: '2026-05-15',
                isTotalSuspension: false,
                memberId: '00000000-0000-0000-0000-000000000000',
            },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El socio especificado no existe');
    });
});
