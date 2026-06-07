import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMemberUseCase } from '../application/NewMemberUseCase.js';
import { GetMembersUseCase } from '../application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from '../application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from '../application/DeleteMemberUseCase.js';
import { CreateMemberRequest, UpdateMemberRequest } from '@alentapp/shared';
import { requestCounter, errorCounter, requestDuration, incrementActiveRequests, decrementActiveRequests } from '../infrastructure/telemetry.js';

export class MemberController {
    constructor(
        private readonly createMemberUseCase: CreateMemberUseCase,
        private readonly getMembersUseCase: GetMembersUseCase,
        private readonly updateMemberUseCase: UpdateMemberUseCase,
        private readonly deleteMemberUseCase: DeleteMemberUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        const start = Date.now();
        const method = _request.method;
        const route = _request.url?.split('?')[0] ?? 'unknown';
        incrementActiveRequests();
        try {
            const socios = await this.getMembersUseCase.execute();
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: socios });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateMemberRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            request.log.info('Alguien pegó al endpoint de ping');
            const socio = await this.createMemberUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: 201 });
            return reply.status(201).send({ data: socio });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateMemberRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const { id } = request.params;
            const socio = await this.updateMemberUseCase.execute(id, request.body);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: socio });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const { id } = request.params;
            await this.deleteMemberUseCase.execute(id);
            requestCounter.add(1, { method, route, status: 204 });
            return reply.status(204).send();
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    private handleError(error: Error, reply: FastifyReply, method: string, route: string) {
        let status = 500;
        if (error.message.includes('Ya existe un miembro con ese DNI')) {
            status = 409;
        } else if (error.message.includes('inválido') || error.message.includes('no existe')) {
            status = 400;
        }
        errorCounter.add(1, { method, route, status });
        return reply.status(status).send({ error: status === 500 ? "Error interno, reintente más tarde" : error.message });
    }
}
