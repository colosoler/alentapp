import { describe, it, expect } from 'vitest';
import { SportValidator } from './SportValidator.js';

describe('SportValidator', () => {
    const validator = new SportValidator();

    const validPayload = {
        name: 'Natacion',
        description: 'Actividad de pileta para todas las edades',
        max_capacity: 20,
        additional_price: 1500,
        requires_medical_certificate: true,
    };

    describe('validateRequiredFields', () => {
        it('debe pasar si todos los campos requeridos estan presentes', () => {
            expect(() => validator.validateRequiredFields(validPayload)).not.toThrow();
        });

        it('debe lanzar error si falta algun campo requerido', () => {
            const { additional_price: _additionalPrice, ...payload } = validPayload;

            expect(() => validator.validateRequiredFields(payload)).toThrow(
                'Faltan campos requeridos',
            );
        });
    });

    describe('validateName', () => {
        it('debe pasar si el nombre del deporte no esta vacio', () => {
            expect(() => validator.validateName('Futbol')).not.toThrow();
        });

        it('debe lanzar error si el nombre del deporte esta vacio', () => {
            expect(() => validator.validateName('   ')).toThrow(
                'El nombre del deporte es obligatorio',
            );
        });
    });

    describe('validateDescription', () => {
        it('debe lanzar error si la descripcion esta vacia', () => {
            expect(() => validator.validateDescription('')).toThrow(
                'La descripcion del deporte es obligatoria',
            );
        });
    });

    describe('validateMaxCapacity', () => {
        it('debe pasar si la capacidad maxima es un entero mayor a cero', () => {
            expect(() => validator.validateMaxCapacity(1)).not.toThrow();
            expect(() => validator.validateMaxCapacity(30)).not.toThrow();
        });

        it('debe lanzar error si la capacidad maxima no es un entero mayor a cero', () => {
            expect(() => validator.validateMaxCapacity(0)).toThrow(
                'La capacidad maxima debe ser mayor a cero',
            );
            expect(() => validator.validateMaxCapacity(-1)).toThrow(
                'La capacidad maxima debe ser mayor a cero',
            );
            expect(() => validator.validateMaxCapacity(2.5)).toThrow(
                'La capacidad maxima debe ser mayor a cero',
            );
        });
    });

    describe('validateAdditionalPrice', () => {
        it('debe lanzar error si el precio adicional es negativo', () => {
            expect(() => validator.validateAdditionalPrice(-1)).toThrow(
                'El precio adicional no puede ser negativo',
            );
        });
    });

    describe('validateRequiresMedicalCertificate', () => {
        it('debe lanzar error si el certificado medico requerido no es booleano', () => {
            expect(() => validator.validateRequiresMedicalCertificate('true')).toThrow(
                'Faltan campos requeridos',
            );
        });
    });
});
