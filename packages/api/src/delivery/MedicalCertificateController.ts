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
            try {
                const anyReq: any = request as any;
                const multipartFields: any = {};
                if (anyReq.isMultipart && anyReq.isMultipart()) {
                    for await (const part of anyReq.parts()) {
                        if (part.file) {
                            const buffer = await part.toBuffer();
                            const filename = part.filename || '';
                            const mimetype = (part.mimetype || '').toLowerCase();
                            const ext = filename.toLowerCase().endsWith('.pdf');
                            const isPdf = mimetype === 'application/pdf' || ext;
                            const maxBytes = 5 * 1024 * 1024;
                            if (!isPdf) {
                                throw new Error('El archivo debe ser un PDF');
                            }
                            if (buffer.length > maxBytes) {
                                throw new Error('El archivo no debe superar 5MB');
                            }
                            const { saveMedicalCertificateFile } = await import('../infrastructure/FileStorage.js');
                            file_url = await saveMedicalCertificateFile(buffer, filename || 'file.pdf');
                        } else {
                            // field
                            multipartFields[part.fieldname] = part.value;
                        }
                    }
                }

                const payloadFromBody: any = { ...(request.body || {}) };
                const payload: any = { ...payloadFromBody, ...multipartFields };
                if (file_url) payload.file_url = file_url;

                const cert = await this.createUseCase.execute(payload);
                return reply.status(201).send({ data: cert });
            } catch (err: any) {
                // if validation error, let outer catch handle it
                throw err;
            }
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
                const multipartFields: any = {};
                if (anyReq.isMultipart && anyReq.isMultipart()) {
                    for await (const part of anyReq.parts()) {
                        if (part.file) {
                            const buffer = await part.toBuffer();
                            const { saveMedicalCertificateFile, deleteMedicalCertificateFileByUrl } = await import('../infrastructure/FileStorage.js');
                            const existing = await this.getByIdUseCase.execute(request.params.id);
                            if (existing && (existing as any).file_url) {
                                await deleteMedicalCertificateFileByUrl((existing as any).file_url);
                            }
                            file_url = await saveMedicalCertificateFile(buffer, part.filename || 'file.png');
                        } else {
                            multipartFields[part.fieldname] = part.value;
                        }
                    }
                }

                const payloadFromBody: any = { ...(request.body || {}) };
                const payload: any = { ...payloadFromBody, ...multipartFields };
                if (file_url) payload.file_url = file_url;

                const cert = await this.updateUseCase.execute(request.params.id, payload);
                return reply.status(200).send({ data: cert });
            } catch (err: any) {
                throw err;
            }
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

