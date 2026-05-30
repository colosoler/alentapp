import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicalCertificateController } from './MedicalCertificateController.js';

describe('MedicalCertificateController delete', () => {
    const mockCreateUseCase = { execute: vi.fn() };
    const mockGetUseCase = { execute: vi.fn() };
    const mockGetByIdUseCase = { execute: vi.fn() };
    const mockGetByMemberUseCase = { execute: vi.fn() };
    const mockGetMemberStatusUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };

    const controller = new MedicalCertificateController(
        mockCreateUseCase as any,
        mockGetUseCase as any,
        mockGetByIdUseCase as any,
        mockGetByMemberUseCase as any,
        mockGetMemberStatusUseCase as any,
        mockUpdateUseCase as any,
        mockDeleteUseCase as any,
    );

    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
    };

    const mockRequest = {
        params: { id: 'cert-1' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe devolver 204 cuando elimina correctamente', async () => {
        mockDeleteUseCase.execute.mockResolvedValueOnce(undefined);

        await controller.delete(mockRequest as any, mockReply as any);

        expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('cert-1');
        expect(mockReply.status).toHaveBeenCalledWith(204);
        expect(mockReply.send).toHaveBeenCalledWith();
    });

    it('debe devolver 400 cuando el id no es valido', async () => {
        mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('El id del certificado no es valido'));

        await controller.delete(mockRequest as any, mockReply as any);

        expect(mockReply.status).toHaveBeenCalledWith(400);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'El id del certificado no es valido' });
    });

    it('debe devolver 500 ante un error generico', async () => {
        mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('DB falló'));

        await controller.delete(mockRequest as any, mockReply as any);

        expect(mockReply.status).toHaveBeenCalledWith(500);
        expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente mas tarde' });
    });
});

export {};