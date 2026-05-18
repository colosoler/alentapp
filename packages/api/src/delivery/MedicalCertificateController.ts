import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMedicalCertificateUseCase } from '../application/CreateMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';
import { UpdateMedicalCertificateUseCase } from '../application/UpdateMedicalCertificateUseCase.js';

export class MedicalCertificateController {
    constructor(
        private readonly createUseCase: CreateMedicalCertificateUseCase,
        private readonly updateUseCase: UpdateMedicalCertificateUseCase,
    ) {}

    async create(request: FastifyRequest<{ Body: CreateMedicalCertificateRequest }>, reply: FastifyReply) {
        try {
            const cert = await this.createUseCase.execute(request.body);
            return reply.status(201).send({ data: cert });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateMedicalCertificateRequest }>, reply: FastifyReply) {
        try {
            const cert = await this.updateUseCase.execute(request.params.id, request.body);
            return reply.status(200).send({ data: cert });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    private handleError(error: Error, reply: FastifyReply) {
        if (
            error.message.includes('Faltan campos requeridos') ||
            error.message.includes('no es valido') ||
            error.message.includes('no es valida') ||
            error.message.includes('posterior') ||
            error.message.includes('estado')
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

