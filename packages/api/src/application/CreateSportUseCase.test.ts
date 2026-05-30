import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSportUseCase } from './CreateSportUseCase.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportValidator } from '../domain/services/SportValidator.js';
import { CreateSportRequest, SportDTO } from '@alentapp/shared';

describe('CreateSportUseCase', () => {
    const mockSportRepo = {
        findByName: vi.fn(),
        create: vi.fn(),
    } as unknown as SportRepository;

    const mockSportValidator = {
        validateRequiredFields: vi.fn(),
        validateName: vi.fn(),
        validateDescription: vi.fn(),
        validateMaxCapacity: vi.fn(),
        validateAdditionalPrice: vi.fn(),
        validateRequiresMedicalCertificate: vi.fn(),
    } as unknown as SportValidator;

    const useCase = new CreateSportUseCase(mockSportRepo, mockSportValidator);

    const validRequest: CreateSportRequest = {
        name: 'Natacion',
        description: 'Actividad de pileta para todas las edades',
        max_capacity: 20,
        additional_price: 1500,
        requires_medical_certificate: true,
    };

    const createdSport: SportDTO = {
        id: 'sport-1',
        ...validRequest,
        current_enrollment_count: 0,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear un deporte si los datos son validos y el nombre no existe', async () => {
        vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce(null);
        vi.mocked(mockSportRepo.create).mockResolvedValueOnce(createdSport);

        const result = await useCase.execute(validRequest);

        expect(mockSportValidator.validateRequiredFields).toHaveBeenCalledWith(validRequest);
        expect(mockSportValidator.validateName).toHaveBeenCalledWith(validRequest.name);
        expect(mockSportValidator.validateDescription).toHaveBeenCalledWith(
            validRequest.description,
        );
        expect(mockSportValidator.validateMaxCapacity).toHaveBeenCalledWith(
            validRequest.max_capacity,
        );
        expect(mockSportValidator.validateAdditionalPrice).toHaveBeenCalledWith(
            validRequest.additional_price,
        );
        expect(mockSportValidator.validateRequiresMedicalCertificate).toHaveBeenCalledWith(
            validRequest.requires_medical_certificate,
        );
        expect(mockSportRepo.findByName).toHaveBeenCalledWith(validRequest.name);
        expect(mockSportRepo.create).toHaveBeenCalledWith(validRequest);
        expect(result).toEqual(createdSport);
    });

    it('debe lanzar error si ya existe un deporte con el mismo nombre', async () => {
        vi.mocked(mockSportRepo.findByName).mockResolvedValueOnce(createdSport);

        await expect(useCase.execute(validRequest)).rejects.toThrow(
            'Ya existe ese deporte',
        );

        expect(mockSportRepo.create).not.toHaveBeenCalled();
    });

    it('no debe buscar ni crear si faltan campos requeridos', async () => {
        vi.mocked(mockSportValidator.validateRequiredFields).mockImplementationOnce(() => {
            throw new Error('Faltan campos requeridos');
        });

        await expect(useCase.execute(validRequest)).rejects.toThrow(
            'Faltan campos requeridos',
        );

        expect(mockSportRepo.findByName).not.toHaveBeenCalled();
        expect(mockSportRepo.create).not.toHaveBeenCalled();
    });
});
