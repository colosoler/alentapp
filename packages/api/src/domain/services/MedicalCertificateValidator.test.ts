import { describe, it, expect } from 'vitest';
import { MedicalCertificateValidator } from './MedicalCertificateValidator.js';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

describe('MedicalCertificateValidator', () => {
    const validator = new MedicalCertificateValidator();

    it('lanza si faltan campos requeridos', () => {
        const partial: Partial<CreateMedicalCertificateRequest> = {
            member_id: undefined as unknown as string,
            issue_date: undefined as unknown as string,
            expiration_date: undefined as unknown as string,
            status: 'Active',
            file_url: null,
        };

        expect(() => validator.validateRequiredFields(partial)).toThrow('Faltan campos requeridos');
    });

    it('valida que el member_id sea un UUID válido', () => {
        expect(() => validator.validateMemberId('not-a-uuid')).toThrow('El id del socio no es válido');

        // UUID válido no debe lanzar
        expect(() => validator.validateMemberId('123e4567-e89b-12d3-a456-426614174000')).not.toThrow();
    });

    it('exige que la fecha de vencimiento sea posterior a la de emisión', () => {
        const issue = '2026-05-10';
        const sameDay = '2026-05-10';
        const before = '2026-05-09';
        const after = '2026-06-01';

        expect(() => validator.validateExpirationDate(issue, sameDay)).toThrow('La fecha de vencimiento debe ser posterior a la de emision');
        expect(() => validator.validateExpirationDate(issue, before)).toThrow('La fecha de vencimiento debe ser posterior a la de emision');
        expect(() => validator.validateExpirationDate(issue, after)).not.toThrow();
    });

    it('valida estados válidos e inválidos', () => {
        expect(() => validator.validateStatus('Active' as any)).not.toThrow();
        expect(() => validator.validateStatus('Inactive' as any)).not.toThrow();
        expect(() => validator.validateStatus('Pending' as any)).toThrow('El estado del certificado no es valido');
    });
});

export {};
