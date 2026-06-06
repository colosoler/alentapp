import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/NewDisciplineUseCase.js';
import { GetDisciplineUseCase } from '../application/GetDisciplineUseCase.js';
import { ListMemberDisciplinesUseCase } from '../application/ListMemberDisciplinesUseCase.js';
import { GetMemberDisciplineStatusUseCase } from '../application/GetMemberDisciplineStatusUseCase.js';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from '../application/DeleteDisciplineUseCase.js';
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';
import { requestCounter, errorCounter, requestDuration, incrementActiveRequests, decrementActiveRequests } from '../infrastructure/telemetry.js';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly getDisciplineUseCase: GetDisciplineUseCase,
        private readonly listMemberDisciplinesUseCase: ListMemberDisciplinesUseCase,
        private readonly getMemberDisciplineStatusUseCase: GetMemberDisciplineStatusUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
        private readonly deleteDisciplineUseCase: DeleteDisciplineUseCase,
    ) {}

    async getById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        incrementActiveRequests();
        try {
            const discipline = await this.getDisciplineUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: discipline });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async getByMember(
        request: FastifyRequest<{ Params: { memberId: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        incrementActiveRequests();
        try {
            const disciplines = await this.listMemberDisciplinesUseCase.execute(request.params.memberId);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: disciplines });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async getMemberStatus(
        request: FastifyRequest<{ Params: { memberId: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        incrementActiveRequests();
        try {
            const status = await this.getMemberDisciplineStatusUseCase.execute(request.params.memberId);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: status });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const discipline = await this.createDisciplineUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: 201 });
            return reply.status(201).send({ data: discipline });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const discipline = await this.updateDisciplineUseCase.execute(request.params.id, request.body);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: discipline });
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
            await this.deleteDisciplineUseCase.execute(request.params.id);
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
        if (
            error.message.includes('no es valido') ||
            error.message.includes('Faltan campos requeridos') ||
            error.message.includes('obligatorio') ||
            error.message.includes('fechas') ||
            error.message.includes('fecha de fin')
        ) {
            status = 400;
        } else if (error.message.includes('no existe')) {
            status = 404;
        }
        errorCounter.add(1, { method, route, status });
        return reply.status(status).send({ error: status === 500 ? 'Error interno, reintente mas tarde' : error.message });
    }
}
