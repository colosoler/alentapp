import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateDisciplineRequest, DisciplineDTO, MemberDTO } from '@alentapp/shared';

const { createdDisciplines } = vi.hoisted(() => {
    process.env.DATABASE_URL =
        process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/alentapp_test_db';
    process.env.NODE_ENV = 'test';

    return {
        createdDisciplines: [] as DisciplineDTO[],
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    const existingMember: MemberDTO = {
        id: 'member-1',
        dni: '12345678',
        name: 'Socio Existente',
        email: 'socio@test.com',
        birthdate: '1990-01-01',
        category: 'Pleno',
        status: 'Activo',
        created_at: '2026-05-01T00:00:00.000Z',
    };

    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                return id === existingMember.id ? existingMember : null;
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

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => {
    return {
        PostgresDisciplineRepository: class {
            async create(data: CreateDisciplineRequest) {
                const discipline = {
                    id: `discipline-${createdDisciplines.length + 1}`,
                    ...data,
                };
                createdDisciplines.push(discipline);
                return discipline;
            }

            async findById(id: string) {
                return createdDisciplines.find((discipline) => discipline.id === id) ?? null;
            }

            async findByMemberId(memberId: string) {
                return createdDisciplines.filter((discipline) => discipline.memberId === memberId);
            }

            async findActiveTotalSuspensionByMemberId() {
                return null;
            }

            async update(id: string, data: any) {
                return { id, ...data };
            }

            async delete() {
                return;
            }
        },
    };
});

describe('Discipline API Integration Tests', () => {
    let app: FastifyInstance;

    const validPayload: CreateDisciplineRequest = {
        reason: 'Conducta antideportiva',
        startDate: '2026-05-01',
        endDate: '2026-05-15',
        isTotalSuspension: true,
        memberId: 'member-1',
    };

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    beforeEach(() => {
        createdDisciplines.length = 0;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/disciplines', () => {
        it('debe retornar 201 y crear la sancion atravesando ruta, controller, use case y validator', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload: validPayload,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data).toEqual({
                id: 'discipline-1',
                ...validPayload,
            });
            expect(createdDisciplines).toHaveLength(1);
        });

        it('debe retornar 400 si falta un campo requerido', async () => {
            const { isTotalSuspension: _isTotalSuspension, ...payload } = validPayload;

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Faltan campos requeridos');
            expect(createdDisciplines).toHaveLength(0);
        });

        it('debe retornar 400 si la fecha de fin no es posterior a la de inicio', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload: {
                    ...validPayload,
                    startDate: '2026-05-15',
                    endDate: '2026-05-01',
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La fecha de fin debe ser posterior a la de inicio');
            expect(createdDisciplines).toHaveLength(0);
        });

        it('debe retornar 404 si el socio informado no existe', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/disciplines',
                payload: {
                    ...validPayload,
                    memberId: 'member-inexistente',
                },
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El socio especificado no existe');
            expect(createdDisciplines).toHaveLength(0);
        });
    });
});
