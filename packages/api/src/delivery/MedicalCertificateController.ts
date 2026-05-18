import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMedicalCertificateUseCase } from '../application/CreateMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../application/GetMedicalCertificatesUseCase.js';
import { GetMedicalCertificateByIdUseCase } from '../application/GetMedicalCertificateByIdUseCase.js';
import { ListMemberMedicalCertificatesUseCase } from '../application/ListMemberMedicalCertificatesUseCase.js';
import { GetMemberMedicalCertificateStatusUseCase } from '../application/GetMemberMedicalCertificateStatusUseCase.js';
import { UpdateMedicalCertificateUseCase } from '../application/UpdateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from '../application/DeleteMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';

export class MedicalCertificateController {
    constructor(
        private readonly createUseCase: CreateMedicalCertificateUseCase,
        private readonly getUseCase: GetMedicalCertificatesUseCase,
        private readonly getByIdUseCase: GetMedicalCertificateByIdUseCase,
        private readonly getByMemberUseCase: ListMemberMedicalCertificatesUseCase,
        private readonly getMemberStatusUseCase: GetMemberMedicalCertificateStatusUseCase,
        private readonly updateUseCase: UpdateMedicalCertificateUseCase,
        private readonly deleteUseCase: DeleteMedicalCertificateUseCase,
    ) {}

    async create(request: FastifyRequest<{ Body: CreateMedicalCertificateRequest }>, reply: FastifyReply) {
        try {
            let file_url: string | undefined;
            // handle multipart file if present
            try {
                const anyReq: any = request as any;
                if (anyReq.isMultipart && anyReq.isMultipart()) {
                    const part = await anyReq.file();
                    if (part) {
                        const buffer = await part.toBuffer();
                        const { saveMedicalCertificateFile } = await import('../infrastructure/FileStorage.js');
                        file_url = await saveMedicalCertificateFile(buffer, part.filename || 'file.png');
                    }
                }
            } catch (err) {
                // ignore if multipart plugin not available
            }

            const payload: any = { ...(request.body || {}) };
            if (file_url) payload.file_url = file_url;

            const cert = await this.createUseCase.execute(payload);
            return reply.status(201).send({ data: cert });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const certs = await this.getUseCase.execute();
            return reply.status(200).send({ data: certs });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateMedicalCertificateRequest }>, reply: FastifyReply) {
        try {
            let file_url: string | undefined;
            try {
                const anyReq: any = request as any;
                if (anyReq.isMultipart && anyReq.isMultipart()) {
                    const part = await anyReq.file();
                    if (part) {
                        const buffer = await part.toBuffer();
                        const { saveMedicalCertificateFile, deleteMedicalCertificateFileByUrl } = await import('../infrastructure/FileStorage.js');
                        // delete existing file if any
                        const existing = await this.getByIdUseCase.execute(request.params.id);
                        if (existing && (existing as any).file_url) {
                            await deleteMedicalCertificateFileByUrl((existing as any).file_url);
                        }
                        file_url = await saveMedicalCertificateFile(buffer, part.filename || 'file.png');
                    }
                }
            } catch (err) {
                // ignore
            }

            const payload: any = { ...(request.body || {}) };
            if (file_url) payload.file_url = file_url;

            const cert = await this.updateUseCase.execute(request.params.id, payload);
            return reply.status(200).send({ data: cert });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            await this.deleteUseCase.execute(request.params.id);
            return reply.status(204).send();
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const cert = await this.getByIdUseCase.execute(request.params.id);
            return reply.status(200).send({ data: cert });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async getByMember(request: FastifyRequest<{ Params: { memberId: string } }>, reply: FastifyReply) {
        try {
            const certs = await this.getByMemberUseCase.execute(request.params.memberId);
            return reply.status(200).send({ data: certs });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async getMemberStatus(request: FastifyRequest<{ Params: { memberId: string } }>, reply: FastifyReply) {
        try {
            const status = await this.getMemberStatusUseCase.execute(request.params.memberId);
            return reply.status(200).send({ data: status });
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

