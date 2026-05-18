import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberMedicalCertificateStatusResponse, MedicalCertificateDTO } from '@alentapp/shared';
import { MemberRepository } from '../domain/MemberRepository.js';

export class GetMemberMedicalCertificateStatusUseCase {
    constructor(
        private readonly certRepo: MedicalCertificateRepository,
        private readonly memberRepo: MemberRepository,
    ) {}

    async execute(memberId: string): Promise<MemberMedicalCertificateStatusResponse> {
        const existingMember = await this.memberRepo.findById(memberId);
        if (!existingMember) {
            throw new Error('El socio especificado no existe');
        }

        const certs: MedicalCertificateDTO[] = await this.certRepo.findByMemberId(memberId);
        const active = certs.find((c) => c.status === 'Active');

        return {
            memberId,
            hasActiveCertificate: Boolean(active),
            ...(active && { activeCertificate: active }),
        } as MemberMedicalCertificateStatusResponse;
    }
}

export default GetMemberMedicalCertificateStatusUseCase;
