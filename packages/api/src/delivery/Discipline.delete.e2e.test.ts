import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

/**
 * Tests E2E para la eliminacion de Sanciones (Discipline).
 * NO hay mocks: se levanta la app entera con buildApp() y se golpea
 * la PostgreSQL real de test (alentapp_test_db) via DATABASE_URL.
 *
 * Como precondicion creamos un socio real (discipline.member_id es FK)
 * y una sancion real que despues eliminamos a traves de la API.
 */
describe('Discipline API End-to-End Tests (Delete)', () => {
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
                dni: `E2EDEL${randomSuffix}`,
                name: 'Socio Delete Discipline E2E',
                email: `discipline.delete.e2e.${randomSuffix}@test.com`,
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',
            },
        });
        memberId = member.id;

        // 4. Precondicion: una sancion real que sera la que eliminemos
        const discipline = await prisma.discipline.create({
            data: {
                reason: 'Motivo a eliminar',
                start_date: new Date('2026-05-01'),
                end_date: new Date('2026-05-15'),
                is_total_suspension: true,
                member_id: memberId,
            },
        });
        disciplineId = discipline.id;
    });

    afterAll(async () => {
        // Tear down: borramos cualquier sancion que haya quedado y luego el socio.
        await prisma.discipline.deleteMany({ where: { member_id: memberId } });
        await prisma.member.deleteMany({ where: { id: memberId } });
        await prisma.$disconnect();
        await app.close();
    });

    it('DELETE: debe eliminar la sancion real de la base de datos', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: `/api/v1/disciplines/${disciplineId}`,
        });

        expect(response.statusCode).toBe(204);
        expect(response.payload).toBe('');

        // Verificacion directa E2E: la sancion ya no existe en PostgreSQL
        const dbDiscipline = await prisma.discipline.findUnique({
            where: { id: disciplineId },
        });
        expect(dbDiscipline).toBeNull();
    });

    it('DELETE: debe fallar con 400 si el id no es un uuid valido', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/api/v1/disciplines/id-invalido',
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('El id de la sancion no es valido');
    });

    it('DELETE: debe fallar con 404 si la sancion a eliminar no existe', async () => {
        const response = await app.inject({
            method: 'DELETE',
            url: '/api/v1/disciplines/11111111-1111-4111-8111-111111111111',
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('La sancion no existe');
    });
});
