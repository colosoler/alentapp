import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSportsUseCase } from './GetSportsUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportDTO } from '@alentapp/shared';

describe('GetSportsUseCase', () => {
    const mockSportRepo = {
        findAll: vi.fn(),
    } as unknown as SportRepository;

    const useCase = new GetSportsUseCase(mockSportRepo);

    const sports: SportDTO[] = [
        {
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Natacion',
            description: 'Actividad de pileta',
            max_capacity: 20,
            current_enrollment_count: 0,
            additional_price: 1500,
            requires_medical_certificate: true,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar la lista de deportes', async () => {
        vi.mocked(mockSportRepo.findAll).mockResolvedValueOnce(sports);

        const result = await useCase.execute({});

        expect(mockSportRepo.findAll).toHaveBeenCalledWith({});
        expect(result).toEqual(sports);
    });

    it('debe enviar el filtro por nombre al repositorio', async () => {
        vi.mocked(mockSportRepo.findAll).mockResolvedValueOnce(sports);

        const result = await useCase.execute({ name: 'nat' });

        expect(mockSportRepo.findAll).toHaveBeenCalledWith({ name: 'nat' });
        expect(result).toEqual(sports);
    });
});
