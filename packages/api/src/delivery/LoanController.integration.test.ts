import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateLoanRequest, LoanDTO, MemberDTO } from '@alentapp/shared';

const { createdLoans, MEMBER_ID, MEMBER_CADETE_ID } = vi.hoisted(() => {
    process.env.DATABASE_URL =
        process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/alentapp_test_db';
    process.env.NODE_ENV = 'test';

    return {
        createdLoans: [] as LoanDTO[],
        MEMBER_ID: '123e4567-e89b-12d3-a456-426614174000',
        MEMBER_CADETE_ID: '123e4567-e89b-12d3-a456-426614174001',
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    const existingMember: MemberDTO = {
        id: MEMBER_ID,
        dni: '12345678',
        name: 'Socio Existente',
        email: 'socio@test.com',
        birthdate: '1990-01-01',
        category: 'Pleno',
        status: 'Activo',
        created_at: '2026-05-01T00:00:00.000Z',
    };

    const cadeteMember: MemberDTO = {
        ...existingMember,
        id: MEMBER_CADETE_ID,
        dni: '87654321',
        name: 'Socio Cadete',
        email: 'cadete@test.com',
        category: 'Cadete',
    };

    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                if (id === existingMember.id) return existingMember;
                if (id === cadeteMember.id) return cadeteMember;
                return null;
            }

            async findByDni() {
                return null;
            }

            async findAll() {
                return [existingMember];
            }

            async create(data: any) {
                return { id: existingMember.id, status: 'Activo', created_at: existingMember.created_at, ...data };
            }

            async update(id: string, data: any) {
                return { ...existingMember, id, ...data };
            }

            async delete() {
                return;
            }
        },
    };
});

vi.mock('../infrastructure/PostgresLoanRepository.js', () => {
    return {
        PostgresLoanRepository: class {
            async create(data: CreateLoanRequest) {
                const loan: LoanDTO = {
                    id: `loan-${createdLoans.length + 1}`,
                    member_id: data.member_id,
                    item_name: data.item_name,
                    loan_date: new Date().toISOString(),
                    due_date: data.due_date,
                    status: 'Loaned',
                };
                createdLoans.push(loan);
                return loan;
            }

            async findById(id: string) {
                return createdLoans.find((loan) => loan.id === id) ?? null;
            }

            async findByMemberId(memberId: string) {
                return createdLoans.filter((loan) => loan.member_id === memberId);
            }

            async findAll() {
                return createdLoans;
            }

            async delete() {
                return;
            }

            async updateStatus(id: string, data: any) {
                const loan = createdLoans.find((l) => l.id === id);
                if (loan) loan.status = data.status;
                return loan!;
            }
        },
    };
});

// === CREATE LOAN ===

describe('Loan API Integration Tests - Create', () => {
    let app: FastifyInstance;

    const validPayload: CreateLoanRequest = {
        member_id: MEMBER_ID,
        item_name: 'Balon de futbol',
        due_date: '2026-06-15',
    };

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    beforeEach(() => {
        createdLoans.length = 0;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/equipment-loan', () => {
        it('debe retornar 201 y crear el prestamo atravesando ruta, controller, use case y validator', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/equipment-loan',
                payload: validPayload,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data).toHaveProperty('id');
            expect(body.data.member_id).toBe(validPayload.member_id);
            expect(body.data.item_name).toBe(validPayload.item_name);
            expect(body.data.status).toBe('Loaned');
            expect(createdLoans).toHaveLength(1);
        });

        it('debe retornar 403 si el socio informado es Cadete', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/equipment-loan',
                payload: {
                    ...validPayload,
                    member_id: MEMBER_CADETE_ID,
                },
            });

            expect(response.statusCode).toBe(403);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Los socios Cadetes tienen prohibido solicitar material');
            expect(createdLoans).toHaveLength(0);
        });
    });
});

// === UPDATE LOAN STATUS ===

describe('Loan API Integration Tests - Update Status', () => {
    let app: FastifyInstance;
    let loanId: string;

    const validPayload: CreateLoanRequest = {
        member_id: MEMBER_ID,
        item_name: 'Balon de futbol',
        due_date: '2026-06-15',
    };

    beforeAll(async () => {
        app = buildApp();
        await app.ready();

        createdLoans.length = 0;

        const createResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/equipment-loan',
            payload: validPayload,
        });
        const body = JSON.parse(createResponse.payload);
        loanId = body.data.id;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('PATCH /api/v1/equipment-loan/:id/status', () => {
        beforeEach(() => {
            const loan = createdLoans.find((l) => l.id === loanId);
            if (loan) loan.status = 'Loaned';
        });

        it('debe retornar 200 y actualizar el estado a Returned', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/equipment-loan/${loanId}/status`,
                payload: { status: 'Returned' },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('Returned');
        });

        it('debe retornar 400 si el prestamo ya fue devuelto', async () => {
            await app.inject({
                method: 'PATCH',
                url: `/api/v1/equipment-loan/${loanId}/status`,
                payload: { status: 'Returned' },
            });

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/equipment-loan/${loanId}/status`,
                payload: { status: 'Returned' },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El préstamo ya fue marcado como devuelto anteriormente');
        });
    });
});
