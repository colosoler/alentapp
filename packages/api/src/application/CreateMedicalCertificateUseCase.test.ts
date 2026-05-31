import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateMedicalCertificateUseCase } from './CreateMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

describe('CreateMedicalCertificateUseCase', () => {
    const mockCertRepo = {
        invalidateActiveByMember: vi.fn(),
        create: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockValidator = {
        validateRequiredFields: vi.fn(),
        validateMemberId: vi.fn(),
        validateIssueDate: vi.fn(),
        validateExpirationDate: vi.fn(),
    } as unknown as MedicalCertificateValidator;

    const useCase = new CreateMedicalCertificateUseCase(mockCertRepo, mockMemberRepo, mockValidator);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un certificado médico correctamente cuando el socio existe y pasa validaciones', async () => {
        const req: CreateMedicalCertificateRequest = {
            member_id: 'member-1',
            issue_date: '2026-05-01',
            expiration_date: '2027-05-01',
            status: 'Active',
            file_url: '/uploads/medical-certificates/file.pdf',
        };

        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'member-1', name: 'Test' });
        vi.mocked(mockCertRepo.invalidateActiveByMember).mockResolvedValueOnce(undefined);
        vi.mocked(mockCertRepo.create).mockResolvedValueOnce({ id: 'cert-1', ...req, created_at: '2026-05-27T00:00:00.000Z' });

        const result = await useCase.execute(req);

        expect(mockValidator.validateRequiredFields).toHaveBeenCalledWith(req);
        expect(mockValidator.validateMemberId).toHaveBeenCalledWith(req.member_id);
        expect(mockValidator.validateIssueDate).toHaveBeenCalledWith(req.issue_date);
        expect(mockValidator.validateExpirationDate).toHaveBeenCalledWith(req.issue_date, req.expiration_date);

        expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-1');
        expect(mockCertRepo.invalidateActiveByMember).toHaveBeenCalledWith('member-1');
        expect(mockCertRepo.create).toHaveBeenCalledWith(req);

        expect(result.id).toBe('cert-1');
    });

    it('debe lanzar error si el socio no existe', async () => {
        const req: CreateMedicalCertificateRequest = {
            member_id: 'missing-member',
            issue_date: '2026-05-01',
            expiration_date: '2027-05-01',
            status: 'Active',
            file_url: null,
        };

        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(req)).rejects.toThrow('El socio especificado no existe');

        expect(mockCertRepo.create).not.toHaveBeenCalled();
    });
});

export {};
