import { CreateMedicalCertificateRequest } from '@alentapp/shared';
import { MedicalCertificateStatus, UpdateMedicalCertificateRequest } from '@alentapp/shared';

export class MedicalCertificateValidator {
    validateCertificateId(id: string): void {
        if (!this.isValidUuid(id)) {
            throw new Error('El id del certificado no es valido');
        }
    }

    validateRequiredFields(data: Partial<CreateMedicalCertificateRequest> | undefined): void {
        if (!data || typeof data.member_id !== 'string' || typeof data.issue_date !== 'string') {
            throw new Error('Faltan campos requeridos');
        }
    }

    validateStatus(status: MedicalCertificateStatus): void {
        if (status !== 'Active' && status !== 'Inactive') {
            throw new Error('El estado del certificado no es valido');
        }
    }

    validateUpdatePayload(data: UpdateMedicalCertificateRequest): void {
        if (data.issueDate !== undefined && !this.parseValidDate(data.issueDate)) {
            throw new Error('La fecha de emision no es valida');
        }

        if (data.expirationDate !== undefined && !this.parseValidDate(data.expirationDate)) {
            throw new Error('La fecha de vencimiento no es valida');
        }

        if (data.issueDate !== undefined && data.expirationDate !== undefined) {
            this.validateExpirationDate(data.issueDate, data.expirationDate);
        }

        if (data.status !== undefined) {
            this.validateStatus(data.status);
        }
    }

    validateMemberId(memberId: string): void {
        if (!this.isValidUuid(memberId)) {
            throw new Error('El id del socio no es válido');
        }
    }

    validateIssueDate(issueDate: string): void {
        if (!this.parseValidDate(issueDate)) {
            throw new Error('La fecha de emision no es valida');
        }
    }

    validateExpirationDate(issueDate: string, expirationDate?: string): void {
        if (!expirationDate) return;

        const issue = this.parseValidDate(issueDate);
        const exp = this.parseValidDate(expirationDate);

        if (!exp) {
            throw new Error('La fecha de vencimiento no es valida');
        }

        if (!issue) {
            throw new Error('La fecha de emision no es valida');
        }

        if (exp <= issue) {
            throw new Error('La fecha de vencimiento debe ser posterior a la de emision');
        }
    }

    private isValidUuid(id: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

    private parseValidDate(value: string): Date | null {
        const dateMatch = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
        if (!dateMatch) return null;

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;

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

export default MedicalCertificateValidator;
