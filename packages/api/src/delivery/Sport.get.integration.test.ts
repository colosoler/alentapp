import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateSportRequest, GetSportsQuery, SportDTO, UpdateSportRequest } from '@alentapp/shared';

const { sports } = vi.hoisted(() => {
    process.env.DATABASE_URL =
        process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/alentapp_test_db';
    process.env.NODE_ENV = 'test';

    return {
        sports: [] as SportDTO[],
    };
});

vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async create(data: CreateSportRequest) {
                const sport = {
                    id: `sport-${sports.length + 1}`,
                    ...data,
                    current_enrollment_count: 0,
                };
                sports.push(sport);
                return sport;
            }

            async findByName(name: string) {
                return sports.find((sport) => sport.name === name) ?? null;
            }

            async findById(id: string) {
                return sports.find((sport) => sport.id === id) ?? null;
            }

            async findAll(query?: GetSportsQuery) {
                if (!query?.name) {
                    return sports;
                }

                const name = query.name.toLowerCase();
                return sports.filter((sport) => sport.name.toLowerCase().includes(name));
            }

            async update(id: string, data: UpdateSportRequest) {
                const index = sports.findIndex((sport) => sport.id === id);
                const updatedSport = {
                    ...sports[index],
                    ...data,
                };
                sports[index] = updatedSport;
                return updatedSport;
            }

            async updateEnrollmentCount(id: string, currentEnrollmentCount: number) {
                const index = sports.findIndex((sport) => sport.id === id);
                const updatedSport = {
                    ...sports[index],
                    current_enrollment_count: currentEnrollmentCount,
                };
                sports[index] = updatedSport;
                return updatedSport;
            }

            async delete(id: string) {
                const index = sports.findIndex((sport) => sport.id === id);
                if (index > -1) {
                    sports.splice(index, 1);
                }
            }
        },
    };
});

describe('Sport API Get Integration Tests', () => {
    let app: FastifyInstance;

    const natacion: SportDTO = {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Natacion',
        description: 'Actividad de pileta',
        max_capacity: 20,
        current_enrollment_count: 0,
        additional_price: 1500,
        requires_medical_certificate: true,
    };

    const futbol: SportDTO = {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Futbol',
        description: 'Actividad en cancha',
        max_capacity: 30,
        current_enrollment_count: 5,
        additional_price: 1000,
        requires_medical_certificate: false,
    };

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    beforeEach(() => {
        sports.length = 0;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/sports', () => {
        it('debe retornar 200 y listar los deportes registrados', async () => {
            sports.push(natacion, futbol);

            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sports',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toEqual([natacion, futbol]);
        });

        it('debe retornar 200 y lista vacia si no existen deportes', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sports',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toEqual([]);
        });
    });

    describe('GET /api/v1/sports/:id', () => {
        it('debe retornar 200 y obtener un deporte por id', async () => {
            sports.push(natacion);

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/sports/${natacion.id}`,
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toEqual(natacion);
        });

        it('debe retornar 400 si el id informado no es valido', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sports/sport-1',
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El id informado no es valido');
        });

        it('debe retornar 404 si el deporte no existe', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sports/33333333-3333-4333-8333-333333333333',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El deporte no existe');
        });
    });
});
