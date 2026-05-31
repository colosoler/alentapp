import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateLockerRequest, RentLockerRequest } from '../../../shared/index.js';

vi.hoisted(() => {
    process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
});

vi.mock('../infrastructure/PostgresLockerRepository.js', () => {
    return {
        PostgresLockerRepository: class {
            // CA 1 simulamos que el numero 99 ya existe en la base de datos
            async existByNumber(number: number) { 
                return number === 99; 
            }
            
            // CA 3 y 6 simulamos la respuesta de la base de datos al guardar
            async save(data: any) { 
                return { id: 'mock-uuid-123', ...data }; 
            }

            async findById(id: string) { 
                if (id === 'locker-available') return { id, status: 'Available' };
                if (id === 'locker-maintenance') return { id, status: 'Maintenance' };
                if (id === 'locker-occupied') return { id, status: 'Occupied' };
                if (id === 'locker-race-condition') return { id, status: 'Available' };
                return null; 
            }

            async updateRent(id: string, memberId: string) { 
                if (id === 'locker-race-condition') throw new Error('CONCURRENCY_ERROR');
                return { id, status: 'Occupied', memberId }; 
            }

            // agregamos mocks vacíos para los demas metodos de la interfaz 
            async findAll() { return []; }
            async updateRelease() { return null; }
            async update() { return null; }
            async findByNumber() { return null; }
            async delete() { return; }
            async updateStatus() { return null; }
        }
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                if (id === 'valid-member-id') return { id, name: 'Socio Valido' };
                return null;
            }
            async findAll() { return []; }
            async findByDni() { return null; }
            async create() { return null; }
            async update() { return null; }
            async delete() { return; }
        }
    };
});

describe('Locker API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/lockers', () => {
        it('CA 3 y 6 - debe retornar 201 y crear el locker (estado Available, memberId null)', async () => {
            const payload: CreateLockerRequest = {
                number: 10,
                location: 'Vestuario Masculino'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.id).toBeDefined();
            expect(body.number).toBe(10);
            expect(body.status).toBe('Available');
            expect(body.memberId).toBeNull();
        });

        it('CA 1 - debe retornar 409 Conflict si el número ya existe', async () => {
            const payload: CreateLockerRequest = {
                number: 99, // numero existente en el mock
                location: 'Pasillo A'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            // el texto debe ser el que lanza LockerValidator
            expect(body.error).toBe('El número de locker ingresado ya se encuentra registrado'); 
        });

        it('CA 4 - debe retornar 400 Bad Request si el estado enviado es Occupied', async () => {
            const payload = {
                number: 15,
                location: 'Vestuario Femenino',
                status: 'Occupied' 
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('Estado inválido');
        });

        it('CA 5 - debe retornar 400 Bad Request si la ubicación está vacía', async () => {
            const payload = {
                number: 16,
                location: '   ' 
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/lockers',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('ubicacion del locker es un campo obligatorio');
        });
    });

    describe('PATCH /api/v1/lockers/:id/rent', () => {
        it('CA 3 - Debe retornar 200 OK y alquilar el locker exitosamente', async () => {
            const payload: RentLockerRequest = { memberId: 'valid-member-id' };
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/lockers/locker-available/rent',
                payload
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.status).toBe('Occupied');
            expect(body.memberId).toBe('valid-member-id');
        });

        it('CA 1 - Debe retornar 404 si el socio no existe', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/lockers/locker-available/rent',
                payload: { memberId: 'invalid-member-id' }
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El socio provisto no existe');
        });

        it('CA 1 - Debe retornar 404 si el locker no existe', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/lockers/invalid-locker-id/rent',
                payload: { memberId: 'valid-member-id' }
            });

            expect(response.statusCode).toBe(404);
        });

        it('CA 2 - Debe retornar 400 Bad Request si el locker está en Maintenance', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/lockers/locker-maintenance/rent',
                payload: { memberId: 'valid-member-id' }
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload).error).toContain('mantenimiento');
        });

        it('CA 2 - Debe retornar 409 Conflict si el locker ya está Occupied', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/lockers/locker-occupied/rent',
                payload: { memberId: 'valid-member-id' }
            });

            expect(response.statusCode).toBe(409);
            expect(JSON.parse(response.payload).error).toContain('ya se encuentra ocupado');
        });

        it('CA 4 - Debe retornar 409 Conflict si ocurre una condición de carrera', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/lockers/locker-race-condition/rent',
                payload: { memberId: 'valid-member-id' }
            });

            expect(response.statusCode).toBe(409);
            expect(JSON.parse(response.payload).error).toBe('El locker acaba de ser alquilado por otro usuario.');
        });
    });
});