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

            async findActiveTotalSuspensionByMemberId(memberId: string, at: Date) {
                return (
                    createdDisciplines.find((discipline) => {
                        const start = new Date(discipline.startDate);
                        const end = new Date(discipline.endDate);

                        return (
                            discipline.memberId === memberId &&
                            discipline.isTotalSuspension &&
                            start <= at &&
                            end > at
                        );
                    }) ?? null
                );
            }

            async update(id: string, data: any) {
                const index = createdDisciplines.findIndex((discipline) => discipline.id === id);
                const updatedDiscipline = {
                    ...createdDisciplines[index],
                    ...data,
                };
                createdDisciplines[index] = updatedDiscipline;
                return updatedDiscipline;
            }

            async delete(id: string) {
                const index = createdDisciplines.findIndex((discipline) => discipline.id === id);
                if (index > -1) {
                    createdDisciplines.splice(index, 1);
                }
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

    const existingDisciplineId = '11111111-1111-4111-8111-111111111111';

    const seedExistingDiscipline = () => {
        createdDisciplines.push({
            id: existingDisciplineId,
            ...validPayload,
        });
    };

    const seedActiveTotalSuspension = () => {
        createdDisciplines.push({
            id: existingDisciplineId,
            reason: 'Suspension total activa',
            startDate: '2000-01-01',
            endDate: '2999-01-01',
            isTotalSuspension: true,
            memberId: 'member-1',
        });
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

    describe('GET /api/v1/disciplines/:id', () => {
        it('debe retornar 200 y obtener una sancion por id atravesando ruta, controller, use case y validator', async () => {
            seedExistingDiscipline();

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/disciplines/${existingDisciplineId}`,
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toEqual({
                id: existingDisciplineId,
                ...validPayload,
            });
        });

        it('debe retornar 400 si el id informado no es valido', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/disciplines/discipline-1',
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El id informado no es valido');
        });

        it('debe retornar 404 si la sancion no existe', async () => {
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/disciplines/${existingDisciplineId}`,
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La sancion no existe');
        });
    });

    describe('GET /api/v1/members/:memberId/disciplines', () => {
        it('debe retornar 200 y listar las sanciones del socio', async () => {
            seedExistingDiscipline();

            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/members/member-1/disciplines',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toEqual([
                {
                    id: existingDisciplineId,
                    ...validPayload,
                },
            ]);
        });

        it('debe retornar 404 si el socio no existe al listar sanciones', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/members/member-inexistente/disciplines',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El socio especificado no existe');
        });
    });

    describe('GET /api/v1/members/:memberId/discipline-status', () => {
        it('debe retornar 200 e indicar suspension si el socio tiene suspension total activa', async () => {
            seedActiveTotalSuspension();

            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/members/member-1/discipline-status',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toEqual({
                memberId: 'member-1',
                isSuspended: true,
                activeTotalSuspension: {
                    id: existingDisciplineId,
                    reason: 'Suspension total activa',
                    startDate: '2000-01-01',
                    endDate: '2999-01-01',
                    isTotalSuspension: true,
                    memberId: 'member-1',
                },
            });
        });

        it('debe retornar 200 e indicar que no esta suspendido si no hay suspension total activa', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/members/member-1/discipline-status',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toEqual({
                memberId: 'member-1',
                isSuspended: false,
            });
        });

        it('debe retornar 404 si el socio no existe al consultar estado disciplinario', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/members/member-inexistente/discipline-status',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El socio especificado no existe');
        });
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

    describe('PUT /api/v1/disciplines/:id', () => {
        it('debe retornar 200 y actualizar la sancion atravesando ruta, controller, use case y validator', async () => {
            seedExistingDiscipline();

            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/disciplines/${existingDisciplineId}`,
                payload: {
                    reason: 'Reincidencia disciplinaria',
                    isTotalSuspension: false,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toEqual({
                id: existingDisciplineId,
                ...validPayload,
                reason: 'Reincidencia disciplinaria',
                isTotalSuspension: false,
            });
            expect(createdDisciplines[0].reason).toBe('Reincidencia disciplinaria');
            expect(createdDisciplines[0].isTotalSuspension).toBe(false);
        });

        it('debe retornar 400 si el id informado no es valido', async () => {
            seedExistingDiscipline();

            const response = await app.inject({
                method: 'PUT',
                url: '/api/v1/disciplines/discipline-1',
                payload: {
                    reason: 'Reincidencia disciplinaria',
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El id de la sancion no es valido');
            expect(createdDisciplines[0].reason).toBe(validPayload.reason);
        });

        it('debe retornar 400 si las fechas actualizadas son invalidas', async () => {
            seedExistingDiscipline();

            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/disciplines/${existingDisciplineId}`,
                payload: {
                    startDate: '2026-05-20',
                    endDate: '2026-05-10',
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La fecha de fin debe ser posterior a la de inicio');
            expect(createdDisciplines[0].startDate).toBe(validPayload.startDate);
            expect(createdDisciplines[0].endDate).toBe(validPayload.endDate);
        });

        it('debe retornar 404 si la sancion a actualizar no existe', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: `/api/v1/disciplines/${existingDisciplineId}`,
                payload: {
                    reason: 'Reincidencia disciplinaria',
                },
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La sancion no existe');
            expect(createdDisciplines).toHaveLength(0);
        });
    });

    describe('DELETE /api/v1/disciplines/:id', () => {
        it('debe retornar 204 y eliminar la sancion atravesando ruta, controller, use case y validator', async () => {
            seedExistingDiscipline();

            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/disciplines/${existingDisciplineId}`,
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
            expect(createdDisciplines).toHaveLength(0);
        });

        it('debe retornar 400 si el id informado no es valido', async () => {
            seedExistingDiscipline();

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/disciplines/discipline-1',
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El id de la sancion no es valido');
            expect(createdDisciplines).toHaveLength(1);
        });

        it('debe retornar 404 si la sancion a eliminar no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/disciplines/${existingDisciplineId}`,
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La sancion no existe');
            expect(createdDisciplines).toHaveLength(0);
        });
    });
});
