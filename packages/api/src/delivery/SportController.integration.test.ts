import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateSportRequest, SportDTO, UpdateSportRequest } from '@alentapp/shared';

const { createdSports } = vi.hoisted(() => {
    process.env.DATABASE_URL =
        process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/alentapp_test_db';
    process.env.NODE_ENV = 'test';

    return {
        createdSports: [] as SportDTO[],
    };
});

vi.mock('../infrastructure/PostgresSportRepository.js', () => {
    return {
        PostgresSportRepository: class {
            async create(data: CreateSportRequest) {
                const sport = {
                    id: `sport-${createdSports.length + 1}`,
                    ...data,
                    current_enrollment_count: 0,
                };
                createdSports.push(sport);
                return sport;
            }

            async findByName(name: string) {
                return createdSports.find((sport) => sport.name === name) ?? null;
            }

            async findById(id: string) {
                return createdSports.find((sport) => sport.id === id) ?? null;
            }

            async findAll() {
                return createdSports;
            }

            async update(id: string, data: UpdateSportRequest) {
                const index = createdSports.findIndex((sport) => sport.id === id);
                const updatedSport = {
                    ...createdSports[index],
                    ...data,
                };
                createdSports[index] = updatedSport;
                return updatedSport;
            }

            async updateEnrollmentCount(id: string, currentEnrollmentCount: number) {
                const index = createdSports.findIndex((sport) => sport.id === id);
                const updatedSport = {
                    ...createdSports[index],
                    current_enrollment_count: currentEnrollmentCount,
                };
                createdSports[index] = updatedSport;
                return updatedSport;
            }

            async delete(id: string) {
                const index = createdSports.findIndex((sport) => sport.id === id);
                if (index > -1) {
                    createdSports.splice(index, 1);
                }
            }
        },
    };
});

describe('Sport API Integration Tests', () => {
    let app: FastifyInstance;

    const validPayload: CreateSportRequest = {
        name: 'Natacion',
        description: 'Actividad de pileta para todas las edades',
        max_capacity: 20,
        additional_price: 1500,
        requires_medical_certificate: true,
    };

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    beforeEach(() => {
        createdSports.length = 0;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/sports', () => {
        it('debe retornar 201 y crear el deporte atravesando ruta, controller, use case y validator', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload: validPayload,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data).toEqual({
                id: 'sport-1',
                ...validPayload,
                current_enrollment_count: 0,
            });
            expect(createdSports).toHaveLength(1);
        });

        it('debe retornar 400 si falta un campo requerido', async () => {
            const { requires_medical_certificate: _requiresMedicalCertificate, ...payload } =
                validPayload;

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload,
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Faltan campos requeridos');
            expect(createdSports).toHaveLength(0);
        });

        it('debe retornar 400 si la capacidad maxima no es valida', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload: {
                    ...validPayload,
                    max_capacity: 0,
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('La capacidad maxima debe ser mayor a cero');
            expect(createdSports).toHaveLength(0);
        });

        it('debe retornar 400 si el precio adicional es negativo', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload: {
                    ...validPayload,
                    additional_price: -1,
                },
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El precio adicional no puede ser negativo');
            expect(createdSports).toHaveLength(0);
        });

        it('debe retornar 409 si ya existe un deporte con el mismo nombre', async () => {
            createdSports.push({
                id: 'sport-existente',
                ...validPayload,
                current_enrollment_count: 0,
            });

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload: validPayload,
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ya existe ese deporte');
            expect(createdSports).toHaveLength(1);
        });
    });
});
