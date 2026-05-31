import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

vi.hoisted(() => {
    process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
});

const payments: any[] = [
    {
        id: 'pago-001',
        amount: 150,
        month: 6,
        year: 2026,
        status: 'Pending',
        dueDate: '2026-06-15T00:00:00.000Z',
        paymentDate: null,
        memberId: 'socio-1',
    },
];

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
            async findById(id: string) {
                return payments.find((p) => p.id === id) || null;
            }
            async update(id: string, data: any) {
                const idx = payments.findIndex((p) => p.id === id);
                if (idx === -1) return null;
                payments[idx] = { ...payments[idx], ...data };
                if (data.status === 'Paid') {
                    payments[idx].paymentDate = new Date().toISOString();
                }
                return payments[idx];
            }
            async cancel(id: string) {
                const idx = payments.findIndex((p) => p.id === id);
                if (idx === -1) return null;
                payments[idx].status = 'Canceled';
                return payments[idx];
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

    beforeEach(() => {
        payments.length = 0;
        payments.push({
            id: 'pago-001',
            amount: 150,
            month: 6,
            year: 2026,
            status: 'Pending',
            dueDate: '2026-06-15T00:00:00.000Z',
            paymentDate: null,
            memberId: 'socio-1',
        });
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

    describe('PUT /api/v1/payments/:id', () => {
        it('Debe devolver 200 y actualizar el estado del pago a Pagado', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/payments/pago-001',
                payload: { status: 'Paid' },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('Paid');
            expect(body.data.paymentDate).not.toBeNull();
        });

        it('Debe devolver 404 cuando el pago no existe', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/payments/pago-inexistente',
                payload: { status: 'Paid' },
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('El pago especificado no existe');
        });
    });

    describe('PATCH /api/v1/payments/:id/cancel', () => {
        it('Debe devolver 200 y cancelar el pago', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/payments/pago-001/cancel',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('Canceled');
        });
    });
});
