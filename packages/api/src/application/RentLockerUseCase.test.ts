import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RentLockerUseCase } from './RentLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { LockerValidator, NotFoundError, ConflictError } from '../domain/services/LockerValidator.js';

describe('RentLockerUseCase', () => {
    let mockLockerRepo: LockerRepository;
    let mockMemberRepo: MemberRepository;
    let validator: LockerValidator;
    let useCase: RentLockerUseCase;

    beforeEach(() => {
        mockLockerRepo = {
            findById: vi.fn(),
            updateRent: vi.fn(),
        } as unknown as LockerRepository;

        mockMemberRepo = {
            findById: vi.fn(),
        } as unknown as MemberRepository;

        validator = new LockerValidator(mockLockerRepo);
        vi.spyOn(validator, 'validateForRent');

        useCase = new RentLockerUseCase(mockLockerRepo, mockMemberRepo, validator);
    });

    it('CA 1 - Debe lanzar NotFoundError si el socio no existe', async () => {
        mockMemberRepo.findById = vi.fn().mockResolvedValue(null);

        await expect(
            useCase.execute('locker-123', { memberId: 'member-999' })
        ).rejects.toThrow(NotFoundError);
    });

    it('Debe delegar la validación del estado del locker al LockerValidator', async () => {
        const mockLocker = { id: 'locker-123', status: 'Available' };
        mockMemberRepo.findById = vi.fn().mockResolvedValue({ id: 'member-999' });
        mockLockerRepo.findById = vi.fn().mockResolvedValue(mockLocker);
        mockLockerRepo.updateRent = vi.fn().mockResolvedValue({ ...mockLocker, status: 'Occupied' });

        await useCase.execute('locker-123', { memberId: 'member-999' });

        // Verificamos que se haya llamado al método que acabamos de crear
        expect(validator.validateForRent).toHaveBeenCalledWith(mockLocker);
    });

    it('CA 3 - Debe alquilar el locker exitosamente llamando al repositorio', async () => {
        mockMemberRepo.findById = vi.fn().mockResolvedValue({ id: 'member-999' });
        mockLockerRepo.findById = vi.fn().mockResolvedValue({ id: 'locker-123', status: 'Available' });
        
        const updatedLocker = { id: 'locker-123', status: 'Occupied', memberId: 'member-999' };
        mockLockerRepo.updateRent = vi.fn().mockResolvedValue(updatedLocker);

        const result = await useCase.execute('locker-123', { memberId: 'member-999' });

        expect(mockLockerRepo.updateRent).toHaveBeenCalledWith('locker-123', 'member-999');
        expect(result).toEqual(updatedLocker);
    });

    it('CA 4 - Debe lanzar ConflictError al atrapar condición de carrera (CONCURRENCY_ERROR)', async () => {
        mockMemberRepo.findById = vi.fn().mockResolvedValue({ id: 'member-999' });
        mockLockerRepo.findById = vi.fn().mockResolvedValue({ id: 'locker-123', status: 'Available' });
        
        // simulamos que prisma lanzó el error de concurrencia al intentar hacer el update atómico
        mockLockerRepo.updateRent = vi.fn().mockRejectedValue(new Error('CONCURRENCY_ERROR'));

        await expect(
            useCase.execute('locker-123', { memberId: 'member-999' })
        ).rejects.toThrow(ConflictError);
    });
});