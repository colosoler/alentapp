import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteMedicalCertificateUseCase } from './DeleteMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

describe('DeleteMedicalCertificateUseCase', () => {
    const mockCertRepo = {
        findById: vi.fn(),
        delete: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const useCase = new DeleteMedicalCertificateUseCase(mockCertRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe lanzar error si el certificado no existe', async () => {
        vi.mocked(mockCertRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('cert-999')).rejects.toThrow('El certificado no existe');

        expect(mockCertRepo.delete).not.toHaveBeenCalled();
    });

    it('debe eliminar el certificado cuando existe', async () => {
        vi.mocked(mockCertRepo.findById).mockResolvedValueOnce({
            id: 'cert-1',
            member_id: '11111111-1111-1111-1111-111111111111',
            issue_date: '2026-05-01',
            expiration_date: '2027-05-01',
            status: 'Active',
            file_url: null,
            created_at: '2026-05-01T00:00:00.000Z',
        });

        await useCase.execute('cert-1');

        expect(mockCertRepo.findById).toHaveBeenCalledWith('cert-1');
        expect(mockCertRepo.delete).toHaveBeenCalledWith('cert-1');
    });

    it('debe propagar error si falla la eliminación en repositorio', async () => {
        vi.mocked(mockCertRepo.findById).mockResolvedValueOnce({
            id: 'cert-1',
            member_id: '11111111-1111-1111-1111-111111111111',
            issue_date: '2026-05-01',
            expiration_date: '2027-05-01',
            status: 'Active',
            file_url: null,
            created_at: '2026-05-01T00:00:00.000Z',
        });
        vi.mocked(mockCertRepo.delete).mockRejectedValueOnce(new Error('DB down'));

        await expect(useCase.execute('cert-1')).rejects.toThrow('DB down');
    });
});

export {};
