import { describe, it, expect } from 'vitest';
import { PaymentValidator } from './PaymentValidator.js';

describe('PaymentValidator', () => {
    const validator = new PaymentValidator();

    it('Debe dar error si faltan campos requeridos o son inválidos', () => {
        expect(() => validator.validateRequiredFields(undefined)).toThrow('Faltan campos requeridos');
        expect(() => validator.validateRequiredFields({ amount: 'x' as any, month: 1, year: 2026, dueDate: '2026-06-15', memberId: 'abc' })).toThrow('Faltan campos requeridos');
    });

    it('Debe dar error si el monto es menor o igual a cero', () => {
            expect(() => validator.validateAmount(0)).toThrow('El monto debe ser mayor a cero');
            expect(() => validator.validateAmount(-10)).toThrow('El monto debe ser mayor a cero');
        });
        
    it('Debe dar error si el mes o el año están fuera del rango válido', () => {
        expect(() => validator.validateMonth(0)).toThrow('El mes debe estar entre 1 y 12');
        expect(() => validator.validateMonth(13)).toThrow('El mes debe estar entre 1 y 12');
        expect(() => validator.validateYear(2000)).toThrow('El año ingresado no es válido');
    });
});
