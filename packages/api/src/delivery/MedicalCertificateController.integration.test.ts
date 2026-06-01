import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

const { previousDatabaseUrl } = vi.hoisted(() => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://localhost:5432/alentapp_test';

    return { previousDatabaseUrl };
});

// Spies y almacén en memoria para los mocks
const deleteCertificateMock = vi.fn();
const certificateStore = new Map<string, any>();

// Mock repositories para probar la integración sin tocar la DB real
vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findById(id: string) {
                return id === '11111111-1111-4111-8111-111111111111'
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
            async create(data: any) {
                const id = `cert-${Math.random().toString(36).slice(2, 9)}`;
                const cert = { id, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: 'Active' };
                certificateStore.set(id, cert);
                return cert;
            }
            async findAll() { return Array.from(certificateStore.values()); }
            async findById(id: string) { return certificateStore.get(id) ?? null; }
            async findByMemberId(memberId: string) { return Array.from(certificateStore.values()).filter(c => c.member_id === memberId); }
            async update(id: string, data: any) {
                const existing = certificateStore.get(id);
                if (!existing) throw new Error('El certificado no existe');
                const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
                certificateStore.set(id, updated);
                return updated;
            }
            async delete(id: string) {
                // provocar fallo para id concreto
                if (id === 'cert-fail') {
                    throw new Error('DB delete failed');
                }
                deleteCertificateMock(id);
                certificateStore.delete(id);
                return;
            }
        }
    };
});

describe('MedicalCertificate API Integration Tests', () => {
    let app: FastifyInstance;
    let buildApp: typeof import('../app.js').buildApp;

    beforeAll(async () => {
        ({ buildApp } = await import('../app.js'));
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
        process.env.DATABASE_URL = previousDatabaseUrl;
    });

    describe('POST /api/v1/medical-certificates', () => {
        it('debe crear un certificado y retornar 201 cuando el socio existe', async () => {
            const payload: CreateMedicalCertificateRequest = {
                member_id: '11111111-1111-4111-8111-111111111111',
                issue_date: '2026-05-01',
                expiration_date: '2027-05-01',
            };

            const response = await app.inject({ method: 'POST', url: '/api/v1/medical-certificates', payload });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeDefined();
            expect(body.data.id).toBeDefined();
            expect(body.data.member_id).toBe(payload.member_id);
        });

        it('debe retornar 400 si faltan campos requeridos', async () => {
            // missing issue_date
            const payload = {
                member_id: '11111111-1111-4111-8111-111111111111',
                expiration_date: '2027-05-01',
                status: 'Active'
            } as any;

            const response = await app.inject({ method: 'POST', url: '/api/v1/medical-certificates', payload });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Faltan campos requeridos');
        });

    });

    describe('DELETE /api/v1/medical-certificates/:id', () => {
        it('debe retornar 204 al eliminar un certificado existente', async () => {
            const createResponse = await app.inject({
                method: 'POST',
                url: '/api/v1/medical-certificates',
                payload: {
                    member_id: '11111111-1111-4111-8111-111111111111',
                    issue_date: '2026-05-01',
                    expiration_date: '2027-05-01',
                },
            });

            expect(createResponse.statusCode).toBe(201);
            const createdBody = JSON.parse(createResponse.payload);

            const deleteResponse = await app.inject({
                method: 'DELETE',
                url: `/api/v1/medical-certificates/${createdBody.data.id}`,
            });

            expect(deleteResponse.statusCode).toBe(204);
            expect(deleteResponse.payload).toBe('');
            expect(deleteCertificateMock).toHaveBeenCalledWith(createdBody.data.id);
        });

        it('debe retornar 404 si el certificado no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/medical-certificates/cert-inexistente',
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El certificado no existe');
        });

        it('debe retornar 404 si el id es invalido o no existe', async () => {
            const response = await app.inject({ method: 'DELETE', url: '/api/v1/medical-certificates/bad-id' });
            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El certificado no existe');
        });

        it('debe retornar 500 si ocurre un error al eliminar en el repositorio', async () => {
            // Insertamos un certificado que provocará fallo en el delete
            const failingCert = {
                id: 'cert-fail',
                member_id: '11111111-1111-4111-8111-111111111111',
                issue_date: '2026-05-01',
                expiration_date: '2027-05-01',
                status: 'Active',
                file_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            certificateStore.set(failingCert.id, failingCert);

            const response = await app.inject({ method: 'DELETE', url: `/api/v1/medical-certificates/${failingCert.id}` });

            expect(response.statusCode).toBe(500);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Error interno, reintente mas tarde');
        });
    });
});

export {};
