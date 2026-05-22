import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDisciplineUseCase } from './NewDisciplineUseCase.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { CreateDisciplineRequest, DisciplineDTO, MemberDTO } from '@alentapp/shared';

describe('CreateDisciplineUseCase', () => {
    const mockDisciplineRepo = {
        create: vi.fn(),
    } as unknown as DisciplineRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockDisciplineValidator = {
        validateRequiredFields: vi.fn(),
        validateReason: vi.fn(),
        validateDates: vi.fn(),
    } as unknown as DisciplineValidator;

    const useCase = new CreateDisciplineUseCase(
        mockDisciplineRepo,
        mockMemberRepo,
        mockDisciplineValidator,
    );

    const validRequest: CreateDisciplineRequest = {
        reason: 'Conducta antideportiva',
        startDate: '2026-05-01',
        endDate: '2026-05-15',
        isTotalSuspension: true,
        memberId: 'member-1',
    };

    const existingMember = {
        id: 'member-1',
        name: 'Socio Existente',
    } as MemberDTO;

    const createdDiscipline: DisciplineDTO = {
        id: 'discipline-1',
        ...validRequest,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear una sancion si los datos son validos y el socio existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(existingMember);
        vi.mocked(mockDisciplineRepo.create).mockResolvedValueOnce(createdDiscipline);

        const result = await useCase.execute(validRequest);

        expect(mockDisciplineValidator.validateRequiredFields).toHaveBeenCalledWith(validRequest);
        expect(mockDisciplineValidator.validateReason).toHaveBeenCalledWith(validRequest.reason);
        expect(mockDisciplineValidator.validateDates).toHaveBeenCalledWith(
            validRequest.startDate,
            validRequest.endDate,
        );
        expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-1');
        expect(mockDisciplineRepo.create).toHaveBeenCalledWith(validRequest);
        expect(result).toEqual(createdDiscipline);
    });

    it('debe lanzar error si el socio informado no existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(validRequest)).rejects.toThrow(
            'El socio especificado no existe',
        );

        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('no debe buscar el socio ni crear si faltan campos requeridos', async () => {
        vi.mocked(mockDisciplineValidator.validateRequiredFields).mockImplementationOnce(() => {
            throw new Error('Faltan campos requeridos');
        });

        await expect(useCase.execute(validRequest)).rejects.toThrow('Faltan campos requeridos');

        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });

    it('no debe buscar el socio ni crear si las fechas son invalidas', async () => {
        vi.mocked(mockDisciplineValidator.validateDates).mockImplementationOnce(() => {
            throw new Error('La fecha de fin debe ser posterior a la de inicio');
        });

        await expect(useCase.execute(validRequest)).rejects.toThrow(
            'La fecha de fin debe ser posterior a la de inicio',
        );

        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
        expect(mockDisciplineRepo.create).not.toHaveBeenCalled();
    });
});
