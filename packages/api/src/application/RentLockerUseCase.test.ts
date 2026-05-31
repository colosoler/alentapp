import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RentLockerUseCase } from './RentLockerUseCase.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { BadRequestError, ConflictError, NotFoundError } from '../domain/services/LockerValidator.js';

describe('RentLockerUseCase', () => {
    let mockLockerRepo: LockerRepository;
    let mockMemberRepo: MemberRepository;
    let useCase: RentLockerUseCase;

    beforeEach(() => {
        // Mockeamos solo los métodos que el UseCase realmente utiliza
        mockLockerRepo = {
            findById: vi.fn(),
            updateRent: vi.fn(),
        } as unknown as LockerRepository;

        mockMemberRepo = {
            findById: vi.fn(),
        } as unknown as MemberRepository;

        useCase = new RentLockerUseCase(mockLockerRepo, mockMemberRepo);
    });

    it('CA 1 - Debe lanzar NotFoundError si el socio no existe', async () => {
        mockMemberRepo.findById = vi.fn().mockResolvedValue(null);

        await expect(
            useCase.execute('locker-123', { memberId: 'member-999' })
        ).rejects.toThrow(NotFoundError);
    });

    it('CA 1 - Debe lanzar NotFoundError si el locker no existe', async () => {
        // simulamos que el socio existe, pero el locker no
        mockMemberRepo.findById = vi.fn().mockResolvedValue({ id: 'member-999' });
        mockLockerRepo.findById = vi.fn().mockResolvedValue(null);

        await expect(
            useCase.execute('locker-invalid', { memberId: 'member-999' })
        ).rejects.toThrow(NotFoundError);
    });

    it('CA 2 - Debe lanzar BadRequestError si el locker está en Maintenance', async () => {
        mockMemberRepo.findById = vi.fn().mockResolvedValue({ id: 'member-999' });
        mockLockerRepo.findById = vi.fn().mockResolvedValue({ id: 'locker-123', status: 'Maintenance' });

        await expect(
            useCase.execute('locker-123', { memberId: 'member-999' })
        ).rejects.toThrow(BadRequestError);
    });

    it('CA 2 - Debe lanzar ConflictError si el locker ya está Occupied', async () => {
        mockMemberRepo.findById = vi.fn().mockResolvedValue({ id: 'member-999' });
        mockLockerRepo.findById = vi.fn().mockResolvedValue({ id: 'locker-123', status: 'Occupied' });

        await expect(
            useCase.execute('locker-123', { memberId: 'member-999' })
        ).rejects.toThrow(ConflictError);
    });

    it('CA 3 - Debe alquilar el locker exitosamente si está Available', async () => {
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