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

describe('Sport API Delete Integration Tests', () => {
    let app: FastifyInstance;

    const sportId = '11111111-1111-4111-8111-111111111111';
    const sport: SportDTO = {
        id: sportId,
        name: 'Natacion',
        description: 'Actividad de pileta',
        max_capacity: 20,
        current_enrollment_count: 0,
        additional_price: 1500,
        requires_medical_certificate: true,
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

    describe('DELETE /api/v1/sports/:id', () => {
        it('debe retornar 204 y eliminar el deporte', async () => {
            sports.push(sport);

            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/sports/${sportId}`,
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
            expect(sports).toHaveLength(0);
        });

        it('debe retornar 400 si el id informado no es valido', async () => {
            sports.push(sport);

            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/sport-1',
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El id informado no es valido');
            expect(sports).toHaveLength(1);
        });

        it('debe retornar 404 si el deporte no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/sports/${sportId}`,
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El deporte no existe');
        });

        it('debe retornar 409 si el deporte tiene inscriptos', async () => {
            sports.push({
                ...sport,
                current_enrollment_count: 1,
            });

            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/sports/${sportId}`,
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('No se puede eliminar un deporte con inscriptos');
            expect(sports).toHaveLength(1);
        });
    });
});
