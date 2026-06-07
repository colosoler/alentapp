import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/CreatePaymentUseCase.js';
import { GetPaymentsUseCase } from '../application/GetPaymentsUseCase.js';
import { GetPaymentByIdUseCase } from '../application/GetPaymentByIdUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';
import { CancelPaymentUseCase } from '../application/CancelPaymentUseCase.js';
import { CreatePaymentRequest, GetPaymentsQuery, UpdatePaymentRequest } from '@alentapp/shared';
import { requestCounter, errorCounter, requestDuration, incrementActiveRequests, decrementActiveRequests } from '../infrastructure/telemetry.js';

export class PaymentController {
    constructor(
        private readonly createPaymentUseCase: CreatePaymentUseCase,
        private readonly getPaymentsUseCase: GetPaymentsUseCase,
        private readonly getPaymentByIdUseCase: GetPaymentByIdUseCase,
        private readonly updatePaymentUseCase: UpdatePaymentUseCase,
        private readonly cancelPaymentUseCase: CancelPaymentUseCase,
    ) {}

    async getAll(
        request: FastifyRequest<{ Querystring: GetPaymentsQuery }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        incrementActiveRequests();
        try {
            const { month } = request.query;

            if (month !== undefined && (month < 1 || month > 12)) {
                errorCounter.add(1, { method, route, status: 400 });
                return reply.status(400).send({ error: 'El mes debe estar entre 1 y 12' });
            }

            const payments = await this.getPaymentsUseCase.execute(request.query);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: payments });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async getById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        incrementActiveRequests();
        try {
            const payment = await this.getPaymentByIdUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: payment });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const payment = await this.createPaymentUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: 201 });
            return reply.status(201).send({ data: payment });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const payment = await this.updatePaymentUseCase.execute(request.params.id, request.body);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: payment });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async cancel(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const payment = await this.cancelPaymentUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: payment });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    private handleError(error: Error, reply: FastifyReply, method: string, route: string) {
        let status = 500;
        if (
            error.message === 'El pago especificado no existe' ||
            error.message.includes('El socio especificado no existe')
        ) {
            status = 404;
        } else if (error.message === 'El pago ya se encuentra cancelado') {
            status = 409;
        } else if (
            error.message.includes('Faltan campos requeridos') ||
            error.message.includes('El monto debe ser mayor a cero') ||
            error.message.includes('El mes debe estar entre 1 y 12') ||
            error.message.includes('El año ingresado no es válido') ||
            error.message.includes('Use el endpoint de cancelación') ||
            error.message.includes('No se puede pagar un pago cancelado') ||
            error.message.includes('Solo se pueden marcar como pagados')
        ) {
            status = 400;
        }
        errorCounter.add(1, { method, route, status });
        return reply.status(status).send({ error: status === 500 ? 'Error interno, reintente más tarde' : error.message });
    }
}
