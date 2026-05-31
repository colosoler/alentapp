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

    // === UPDATE LOAN STATUS ===

    describe('validateItemName - Update Loan Status', () => {
        it('debe lanzar error si el nombre del item esta vacio', () => {
            expect(() => validator.validateItemName('   ')).toThrow(
                'El nombre del ítem es obligatorio',
            );
        });
    });

    describe('validateMemberId - Update Loan Status', () => {
        it('debe lanzar error si el member_id no es un UUID valido', () => {
            expect(() => validator.validateMemberId('invalid-id')).toThrow(
                'El id del socio no es válido',
            );
        });
    });

    // === LIST LOANS ===

    describe('validateDueDate - List Loans', () => {
        it('debe lanzar error si la fecha de devolucion no es una fecha valida', () => {
            expect(() => validator.validateDueDate('fecha-invalida', new Date())).toThrow(
                'La fecha de devolución no es válida',
            );
        });

        it('debe lanzar error si la fecha de devolucion es anterior a la de prestamo', () => {
            const loanDate = new Date('2026-06-01');
            expect(() => validator.validateDueDate('2026-05-01', loanDate)).toThrow(
                'La fecha de devolución debe ser posterior a la de inicio',
            );
        });
    });
});
