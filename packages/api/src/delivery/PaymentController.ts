import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/CreatePaymentUseCase.js';
import { GetPaymentsUseCase } from '../application/GetPaymentsUseCase.js';
import { GetPaymentByIdUseCase } from '../application/GetPaymentByIdUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';
import { CancelPaymentUseCase } from '../application/CancelPaymentUseCase.js';
import { CreatePaymentRequest, GetPaymentsQuery, UpdatePaymentRequest } from '@alentapp/shared';

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
        try {
            const { month } = request.query;

            if (month !== undefined && (month < 1 || month > 12)) {
                return reply.status(400).send({ error: 'El mes debe estar entre 1 y 12' });
            }

            const payments = await this.getPaymentsUseCase.execute(request.query);
            return reply.status(200).send({ data: payments });
        } catch (error: any) {
            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }

    async getById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const payment = await this.getPaymentByIdUseCase.execute(request.params.id);
            return reply.status(200).send({ data: payment });
        } catch (error: any) {
            if (error.message === 'El pago especificado no existe') {
                return reply.status(404).send({ error: error.message });
            }

            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const payment = await this.createPaymentUseCase.execute(request.body);
            return reply.status(201).send({ data: payment });
        } catch (error: any) {
            if (error.message.includes('El socio especificado no existe')) {
                return reply.status(404).send({ error: error.message });
            }

            if (
                error.message.includes('Faltan campos requeridos') ||
                error.message.includes('El monto debe ser mayor a cero') ||
                error.message.includes('El mes debe estar entre 1 y 12') ||
                error.message.includes('El año ingresado no es válido')
            ) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const payment = await this.updatePaymentUseCase.execute(request.params.id, request.body);
            return reply.status(200).send({ data: payment });
        } catch (error: any) {
            if (error.message === 'El pago especificado no existe') {
                return reply.status(404).send({ error: error.message });
            }

            if (
                error.message.includes('El monto debe ser mayor a cero') ||
                error.message.includes('El mes debe estar entre 1 y 12') ||
                error.message.includes('El año ingresado no es válido') ||
                error.message.includes('Use el endpoint de cancelación') ||
                error.message.includes('No se puede pagar un pago cancelado') ||
                error.message.includes('Solo se pueden marcar como pagados')
            ) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }

    async cancel(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const payment = await this.cancelPaymentUseCase.execute(request.params.id);
            return reply.status(200).send({ data: payment });
        } catch (error: any) {
            if (error.message === 'El pago especificado no existe') {
                return reply.status(404).send({ error: error.message });
            }

            if (error.message === 'El pago ya se encuentra cancelado') {
                return reply.status(409).send({ error: error.message });
            }

            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }
}
