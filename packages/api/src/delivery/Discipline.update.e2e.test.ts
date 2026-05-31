import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

/**
 * Tests E2E para la actualizacion de Sanciones (Discipline).
 * NO hay mocks: se levanta la app entera con buildApp() y se golpea
 * la PostgreSQL real de test (alentapp_test_db) via DATABASE_URL.
 *
 * Como precondicion creamos un socio real (discipline.member_id es FK)
 * y una sancion real que despues actualizamos a traves de la API.
 */
describe('Discipline API End-to-End Tests (Update)', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let memberId: string;
    let disciplineId: string;

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

        // 3. Precondicion: un socio real
        const member = await prisma.member.create({
            data: {
                dni: `E2EUPD${randomSuffix}`,
                name: 'Socio Update Discipline E2E',
                email: `discipline.update.e2e.${randomSuffix}@test.com`,
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',
            },
        });
        memberId = member.id;

        // 4. Precondicion: una sancion real que sera la que actualicemos
        const discipline = await prisma.discipline.create({
            data: {
                reason: 'Motivo original',
                start_date: new Date('2026-05-01'),
                end_date: new Date('2026-05-15'),
                is_total_suspension: true,
                member_id: memberId,
            },
        });
        disciplineId = discipline.id;
    });

    afterAll(async () => {
        // Tear down: borramos sanciones del socio y luego el socio.
        await prisma.discipline.deleteMany({ where: { member_id: memberId } });
        await prisma.member.deleteMany({ where: { id: memberId } });
        await prisma.$disconnect();
        await app.close();
    });

    it('PUT: debe actualizar la sancion real en la base de datos', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/disciplines/${disciplineId}`,
            payload: {
                reason: 'Motivo actualizado',
                isTotalSuspension: false,
            },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data.id).toBe(disciplineId);
        expect(body.data.reason).toBe('Motivo actualizado');
        expect(body.data.isTotalSuspension).toBe(false);

        // Verificacion directa E2E: el cambio quedo persistido en PostgreSQL
        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: disciplineId },
        });
        expect(dbDiscipline?.reason).toBe('Motivo actualizado');
        expect(dbDiscipline?.is_total_suspension).toBe(false);
    });

    it('PUT: debe fallar con 400 si el id no es un uuid valido', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/disciplines/id-invalido',
            payload: { reason: 'Motivo cualquiera' },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El id de la sancion no es valido');
    });

    it('PUT: debe fallar con 400 si la fecha de fin no es posterior a la de inicio', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: `/api/v1/disciplines/${disciplineId}`,
            payload: {
                startDate: '2026-05-20',
                endDate: '2026-05-10',
            },
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('La fecha de fin debe ser posterior a la de inicio');
    });

    it('PUT: debe fallar con 404 si la sancion a actualizar no existe', async () => {
        const response = await app.inject({
            method: 'PUT',
            url: '/api/v1/disciplines/11111111-1111-4111-8111-111111111111',
            payload: { reason: 'Motivo actualizado' },
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('La sancion no existe');
    });
});
