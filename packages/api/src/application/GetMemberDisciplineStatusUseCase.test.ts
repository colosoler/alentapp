import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMemberDisciplineStatusUseCase } from './GetMemberDisciplineStatusUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { DisciplineDTO, MemberDTO } from '@alentapp/shared';

describe('GetMemberDisciplineStatusUseCase', () => {
    const mockDisciplineRepo = {
        findActiveTotalSuspensionByMemberId: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const useCase = new GetMemberDisciplineStatusUseCase(mockDisciplineRepo, mockMemberRepo);

    const memberId = 'member-1';
    const existingMember = {
        id: memberId,
        name: 'Socio Existente',
    } as MemberDTO;

    const activeTotalSuspension: DisciplineDTO = {
        id: '11111111-1111-4111-8111-111111111111',
        reason: 'Suspension total',
        startDate: '2000-01-01',
        endDate: '2999-01-01',
        isTotalSuspension: true,
        memberId,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe indicar que el socio esta suspendido si tiene suspension total activa', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(existingMember);
        vi.mocked(mockDisciplineRepo.findActiveTotalSuspensionByMemberId).mockResolvedValueOnce(
            activeTotalSuspension,
        );

        const result = await useCase.execute(memberId);

        expect(mockMemberRepo.findById).toHaveBeenCalledWith(memberId);
        expect(mockDisciplineRepo.findActiveTotalSuspensionByMemberId).toHaveBeenCalledWith(
            memberId,
            expect.any(Date),
        );
        expect(result).toEqual({
            memberId,
            isSuspended: true,
            activeTotalSuspension,
        });
    });

    it('debe indicar que el socio no esta suspendido si no tiene suspension total activa', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(existingMember);
        vi.mocked(mockDisciplineRepo.findActiveTotalSuspensionByMemberId).mockResolvedValueOnce(null);

        const result = await useCase.execute(memberId);

        expect(result).toEqual({
            memberId,
            isSuspended: false,
        });
    });

    it('debe lanzar error si el socio no existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(memberId)).rejects.toThrow('El socio especificado no existe');

        expect(mockDisciplineRepo.findActiveTotalSuspensionByMemberId).not.toHaveBeenCalled();
    });
});
