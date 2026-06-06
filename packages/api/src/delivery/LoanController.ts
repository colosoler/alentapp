import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLoanUseCase } from '../application/CreateLoanUseCase.js';
import { GetLoansUseCase } from '../application/GetLoansUseCase.js';
import { DeleteLoanUseCase } from '../application/DeleteLoanUseCase.js';
import { UpdateLoanStatusUseCase } from '../application/UpdateLoanStatusUseCase.js';
import { CreateLoanRequest, GetLoansQuery, UpdateLoanStatusRequest } from '@alentapp/shared';
import { requestCounter, errorCounter, requestDuration, incrementActiveRequests, decrementActiveRequests } from '../infrastructure/telemetry.js';

export class LoanController {
    constructor(
        private readonly createLoanUseCase: CreateLoanUseCase,
        private readonly getLoansUseCase: GetLoansUseCase,
        private readonly deleteLoanUseCase: DeleteLoanUseCase,
        private readonly updateLoanStatusUseCase: UpdateLoanStatusUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateLoanRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const loan = await this.createLoanUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: 201 });
            return reply.status(201).send({ data: loan });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async getAll(
        request: FastifyRequest<{ Querystring: GetLoansQuery }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        incrementActiveRequests();
        try {
            const loans = await this.getLoansUseCase.execute(request.query);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: loans });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
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
            await this.deleteLoanUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: 204 });
            return reply.status(204).send();
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async updateStatus(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateLoanStatusRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const loan = await this.updateLoanStatusUseCase.execute(request.params.id, request.body);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: loan });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    private handleError(error: Error, reply: FastifyReply, method: string, route: string) {
        let status = 500;
        if (
            error.message.includes('Faltan campos requeridos') ||
            error.message.includes('obligatorio') ||
            error.message.includes('no es válido') ||
            error.message.includes('posterior') ||
            error.message.includes('ya finalized') ||
            error.message.includes('ya fue marcado')
        ) {
            status = 400;
        } else if (
            error.message.includes('Cadetes tienen prohibido') ||
            error.message.includes('Tiempo límite')
        ) {
            status = 403;
        } else if (error.message.includes('no existe')) {
            status = 404;
        }
        errorCounter.add(1, { method, route, status });
        return reply.status(status).send({ error: status === 500 ? 'Error interno, reintente mas tarde' : error.message });
    }
}
