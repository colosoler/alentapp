import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

vi.hoisted(() => {
    process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
});

vi.mock('../infrastructure/PostgresPaymentRepository.js', () => {
    return {
        PostgresPaymentRepository: class {
            async create(data: any) {
                return {
                    id: 'payment-mock-001',
                    amount: data.amount,
                    month: data.month,
                    year: data.year,
                    status: 'Pending',
                    dueDate: new Date(data.dueDate).toISOString(),
                    paymentDate: null,
                    memberId: data.memberId,
                };
            }
        },
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                return id === 'socio-existente'
                    ? { id: 'socio-existente', name: 'Socio de prueba' }
                    : null;
            }
        },
    };
});

describe('Pruebas de Integración de la API de Pagos', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/payments', () => {
        it('Debe devolver 201 y crear un pago', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload: {
                    amount: 150,
                    month: 6,
                    year: 2026,
                    dueDate: '2026-06-15',
                    memberId: 'socio-existente',
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeDefined();
            expect(body.data.status).toBe('Pending');
        });

        it('Debe devolver 400 cuando faltan campos requeridos', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload: {
                    amount: 150,
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('Faltan campos requeridos');
        });

        it('Debe devolver 404 cuando el miembro no existe', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload: {
                    amount: 200,
                    month: 7,
                    year: 2026,
                    dueDate: '2026-07-15',
                    memberId: 'Socio-no-existente',
                },
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('El socio especificado no existe');
        });
    });
});