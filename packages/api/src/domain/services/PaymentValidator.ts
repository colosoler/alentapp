import { CreatePaymentRequest } from '@alentapp/shared';

export class PaymentValidator {
    validateRequiredFields(data: Partial<CreatePaymentRequest> | undefined): void {
        if (
            !data ||
            typeof data.amount !== 'number' ||
            typeof data.month !== 'number' ||
            typeof data.year !== 'number' ||
            typeof data.dueDate !== 'string' ||
            typeof data.memberId !== 'string'
        ) {
            throw new Error('Faltan campos requeridos');
        }
    }

    validateAmount(amount: number): void {
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error('El monto debe ser mayor a cero');
        }
    }

    validateMonth(month: number): void {
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            throw new Error('El mes debe estar entre 1 y 12');
        }
    }

    validateYear(year: number): void {
        if (!Number.isInteger(year) || year <= 2000) {
            throw new Error('El año ingresado no es válido');
        }
    }

    validateDueDate(dueDate: string): void {
        if (!this.parseValidDate(dueDate)) {
            throw new Error('La fecha de vencimiento no es válida');
        }
    }

    private parseValidDate(value: string): Date | null {
        const dateMatch = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
        if (!dateMatch) {
            return null;
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return null;
        }

        const year = Number(dateMatch[1]);
        const month = Number(dateMatch[2]);
        const day = Number(dateMatch[3]);
        const calendarDate = new Date(Date.UTC(year, month - 1, day));

        if (
            calendarDate.getUTCFullYear() !== year ||
            calendarDate.getUTCMonth() !== month - 1 ||
            calendarDate.getUTCDate() !== day
        ) {
            return null;
        }

        return date;
    }
}
