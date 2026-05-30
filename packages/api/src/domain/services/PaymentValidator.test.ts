import { describe, it, expect } from 'vitest';
import { PaymentValidator } from './PaymentValidator.js';

describe('PaymentValidator', () => {
    const validator = new PaymentValidator();

    it('Debe dar error si faltan campos requeridos o son inválidos', () => {
        expect(() => validator.validateRequiredFields(undefined)).toThrow('Faltan campos requeridos');
        expect(() => validator.validateRequiredFields({ amount: 'x' as any, month: 1, year: 2026, dueDate: '2026-06-15', memberId: 'abc' })).toThrow('Faltan campos requeridos');
    });

});
