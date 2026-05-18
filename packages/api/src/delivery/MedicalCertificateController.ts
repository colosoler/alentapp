import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMedicalCertificateUseCase } from '../application/CreateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from '../application/DeleteMedicalCertificateUseCase.js';
import { GetMedicalCertificateUseCase } from '../application/GetMedicalCertificateUseCase.js';
import { ListMemberMedicalCertificatesUseCase } from '../application/ListMemberMedicalCertificatesUseCase.js';
import { GetMemberMedicalCertificateStatusUseCase } from '../application/GetMemberMedicalCertificateStatusUseCase.js';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

export class MedicalCertificateController {
    constructor(
        private readonly createUseCase: CreateMedicalCertificateUseCase,
        private readonly deleteUseCase?: DeleteMedicalCertificateUseCase,
        private readonly getUseCase?: GetMedicalCertificateUseCase,
        private readonly listByMemberUseCase?: ListMemberMedicalCertificatesUseCase,
        private readonly memberStatusUseCase?: GetMemberMedicalCertificateStatusUseCase,
    ) {}

    async create(request: FastifyRequest<{ Body: CreateMedicalCertificateRequest }>, reply: FastifyReply) {
        try {
            const cert = await this.createUseCase.execute(request.body);
            return reply.status(201).send({ data: cert });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            if (!this.deleteUseCase) {
                return reply.status(500).send({ error: 'Delete use case not configured' });
            }

            await this.deleteUseCase.execute(request.params.id);
            return reply.status(204).send();
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            if (!this.getUseCase) return reply.status(500).send({ error: 'Get use case not configured' });
            const cert = await this.getUseCase.execute(request.params.id);
            return reply.status(200).send({ data: cert });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async listByMember(request: FastifyRequest<{ Params: { memberId: string } }>, reply: FastifyReply) {
        try {
            if (!this.listByMemberUseCase) return reply.status(500).send({ error: 'List use case not configured' });
            const certs = await this.listByMemberUseCase.execute(request.params.memberId);
            return reply.status(200).send({ data: certs });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async memberStatus(request: FastifyRequest<{ Params: { memberId: string } }>, reply: FastifyReply) {
        try {
            if (!this.memberStatusUseCase) return reply.status(500).send({ error: 'Status use case not configured' });
            const status = await this.memberStatusUseCase.execute(request.params.memberId);
            return reply.status(200).send({ data: status });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    private handleError(error: Error, reply: FastifyReply) {
        if (
            error.message.includes('Faltan campos requeridos') ||
            error.message.includes('no es valida') ||
            error.message.includes('posterior')
        ) {
            return reply.status(400).send({ error: error.message });
        }

        if (error.message.includes('no existe')) {
            return reply.status(404).send({ error: error.message });
        }

        return reply.status(500).send({ error: 'Error interno, reintente mas tarde' });
    }
}

export default MedicalCertificateController;

