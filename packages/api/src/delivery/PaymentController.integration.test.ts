import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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
        memberId: 'member-1',
    },
];

vi.mock('../infrastructure/PostgresPaymentRepository.js', () => {
    return {
        PostgresPaymentRepository: class {
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
    });
});
