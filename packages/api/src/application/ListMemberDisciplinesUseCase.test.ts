import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListMemberDisciplinesUseCase } from './ListMemberDisciplinesUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { DisciplineDTO, MemberDTO } from '@alentapp/shared';

describe('ListMemberDisciplinesUseCase', () => {
    const mockDisciplineRepo = {
        findByMemberId: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const useCase = new ListMemberDisciplinesUseCase(mockDisciplineRepo, mockMemberRepo);

    const memberId = 'member-1';
    const existingMember = {
        id: memberId,
        name: 'Socio Existente',
    } as MemberDTO;

    const disciplines: DisciplineDTO[] = [
        {
            id: '11111111-1111-4111-8111-111111111111',
            reason: 'Conducta antideportiva',
            startDate: '2026-05-01',
            endDate: '2026-05-15',
            isTotalSuspension: true,
            memberId,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar las sanciones del socio si existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(existingMember);
        vi.mocked(mockDisciplineRepo.findByMemberId).mockResolvedValueOnce(disciplines);

        const result = await useCase.execute(memberId);

        expect(mockMemberRepo.findById).toHaveBeenCalledWith(memberId);
        expect(mockDisciplineRepo.findByMemberId).toHaveBeenCalledWith(memberId);
        expect(result).toEqual(disciplines);
    });

    it('debe retornar una lista vacia si el socio existe y no tiene sanciones', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(existingMember);
        vi.mocked(mockDisciplineRepo.findByMemberId).mockResolvedValueOnce([]);

        const result = await useCase.execute(memberId);

        expect(result).toEqual([]);
    });

    it('debe lanzar error si el socio no existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(memberId)).rejects.toThrow('El socio especificado no existe');

        expect(mockDisciplineRepo.findByMemberId).not.toHaveBeenCalled();
    });
});
