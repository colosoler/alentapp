import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

// Mock repositories para probar la integración sin tocar la DB real
vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                return id === '11111111-1111-1111-1111-111111111111'
                    ? { id, name: 'Socio Integracion', birthdate: '1990-01-01' }
                    : null;
            }
        }
    };
});

vi.mock('../infrastructure/PostgresMedicalCertificateRepository.js', () => {
    return {
        PostgresMedicalCertificateRepository: class {
            async invalidateActiveByMember() { return; }
            async create(data: any) { return { id: 'cert-1', ...data, created_at: new Date().toISOString() }; }
            async findAll() { return []; }
            async findById() { return null; }
            async findByMemberId() { return []; }
            async update() { return null; }
            async delete() { return; }
        }
    };
});

describe('MedicalCertificate API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/medical-certificates', () => {
        it('debe crear un certificado y retornar 201 cuando el socio existe', async () => {
            const payload: CreateMedicalCertificateRequest = {
                member_id: '11111111-1111-1111-1111-111111111111',
                issue_date: '2026-05-01',
                expiration_date: '2027-05-01',
                status: 'Active',
                file_url: null,
            };

            const response = await app.inject({ method: 'POST', url: '/api/v1/medical-certificates', payload });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeDefined();
            expect(body.data.id).toBe('cert-1');
            expect(body.data.member_id).toBe(payload.member_id);
        });

        it('debe retornar 400 si faltan campos requeridos', async () => {
            // missing issue_date
            const payload = {
                member_id: '11111111-1111-1111-1111-111111111111',
                expiration_date: '2027-05-01',
                status: 'Active'
            } as any;

            const response = await app.inject({ method: 'POST', url: '/api/v1/medical-certificates', payload });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Faltan campos requeridos');
        });
    });
});

export {};
