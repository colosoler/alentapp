import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMedicalCertificateUseCase } from '../application/CreateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from '../application/DeleteMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

export class MedicalCertificateController {
    constructor(
        private readonly createUseCase: CreateMedicalCertificateUseCase,
        private readonly deleteUseCase?: DeleteMedicalCertificateUseCase,
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

