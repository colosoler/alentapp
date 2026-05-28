import { describe, it, expect } from 'vitest';
import { LoanValidator } from './LoanValidator.js';

describe('LoanValidator', () => {
    const validator = new LoanValidator();

    // === CREATE LOAN ===

    describe('validateRequiredFields - Create Loan', () => {
        it('debe pasar si todos los campos requeridos estan presentes', () => {
            expect(() =>
                validator.validateRequiredFields({
                    member_id: '123e4567-e89b-12d3-a456-426614174000',
                    item_name: 'Balon de futbol',
                    due_date: '2026-06-15',
                }),
            ).not.toThrow();
        });

        it('debe lanzar error si falta algun campo requerido', () => {
            expect(() =>
                validator.validateRequiredFields({
                    member_id: '123e4567-e89b-12d3-a456-426614174000',
                }),
            ).toThrow('Faltan campos requeridos');
        });
    });
});
