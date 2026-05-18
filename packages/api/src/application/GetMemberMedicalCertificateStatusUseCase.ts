import { MemberMedicalCertificateStatusResponse } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

export class GetMemberMedicalCertificateStatusUseCase {
    constructor(private readonly certRepo: MedicalCertificateRepository) {}

    async execute(memberId: string): Promise<MemberMedicalCertificateStatusResponse> {
        const certs = await this.certRepo.findByMemberId(memberId);
        const active = certs.find((c) => c.status === 'Active');

        return {
            memberId,
            hasActiveCertificate: Boolean(active),
            activeCertificate: active || undefined,
        };
    }
}

export default GetMemberMedicalCertificateStatusUseCase;
