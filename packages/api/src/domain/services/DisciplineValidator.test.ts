import { describe, it, expect } from 'vitest';
import { DisciplineValidator } from './DisciplineValidator.js';

describe('DisciplineValidator', () => {
    const validator = new DisciplineValidator();

    describe('validateRequiredFields', () => {
        it('debe pasar si todos los campos requeridos estan presentes', () => {
            expect(() =>
                validator.validateRequiredFields({
                    reason: 'Conducta antideportiva',
                    startDate: '2026-05-01',
                    endDate: '2026-05-15',
                    isTotalSuspension: true,
                    memberId: 'member-1',
                }),
            ).not.toThrow();
        });

        it('debe lanzar error si falta algun campo requerido', () => {
            expect(() =>
                validator.validateRequiredFields({
                    reason: 'Conducta antideportiva',
                    startDate: '2026-05-01',
                    endDate: '2026-05-15',
                    memberId: 'member-1',
                }),
            ).toThrow('Faltan campos requeridos');
        });
    });

    describe('validateReason', () => {
        it('debe lanzar error si el motivo esta vacio', () => {
            expect(() => validator.validateReason('   ')).toThrow(
                'El motivo de la sancion es obligatorio',
            );
        });
    });

    describe('validateDates', () => {
        it('debe lanzar error si alguna fecha no es valida', () => {
            expect(() => validator.validateDates('2026-02-30', '2026-03-10')).toThrow(
                'Las fechas ingresadas no son validas',
            );
        });

        it('debe lanzar error si la fecha de fin no es posterior a la de inicio', () => {
            expect(() => validator.validateDates('2026-05-15', '2026-05-15')).toThrow(
                'La fecha de fin debe ser posterior a la de inicio',
            );
        });
    });

    describe('validateTotalSuspension', () => {
        it('debe pasar si el valor informado es booleano', () => {
            expect(() => validator.validateTotalSuspension(true)).not.toThrow();
            expect(() => validator.validateTotalSuspension(false)).not.toThrow();
        });

        it('debe lanzar error si el valor informado no es booleano', () => {
            expect(() => validator.validateTotalSuspension('true')).toThrow(
                'Faltan campos requeridos',
            );
        });
    });

    describe('validateDisciplineId', () => {
        it('debe pasar si el id de sancion es un UUID valido', () => {
            expect(() =>
                validator.validateDisciplineId('11111111-1111-4111-8111-111111111111'),
            ).not.toThrow();
        });

        it('debe lanzar error si el id de sancion no es un UUID valido', () => {
            expect(() => validator.validateDisciplineId('discipline-1')).toThrow(
                'El id de la sancion no es valido',
            );
        });
    });

    describe('validateReportedId', () => {
        it('debe pasar si el id informado es un UUID valido', () => {
            expect(() =>
                validator.validateReportedId('11111111-1111-4111-8111-111111111111'),
            ).not.toThrow();
        });

        it('debe lanzar error si el id informado no es un UUID valido', () => {
            expect(() => validator.validateReportedId('discipline-1')).toThrow(
                'El id informado no es valido',
            );
        });
    });
});
