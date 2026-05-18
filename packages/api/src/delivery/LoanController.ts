import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLoanUseCase } from '../application/CreateLoanUseCase.js';
import { GetLoansUseCase } from '../application/GetLoansUseCase.js';
import { DeleteLoanUseCase } from '../application/DeleteLoanUseCase.js';
import { UpdateLoanStatusUseCase } from '../application/UpdateLoanStatusUseCase.js';
import { CreateLoanRequest, GetLoansQuery, UpdateLoanStatusRequest } from '@alentapp/shared';

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
        try {
            const loan = await this.createLoanUseCase.execute(request.body);
            return reply.status(201).send({ data: loan });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async getAll(
        request: FastifyRequest<{ Querystring: GetLoansQuery }>,
        reply: FastifyReply,
    ) {
        try {
            const loans = await this.getLoansUseCase.execute(request.query);
            return reply.status(200).send({ data: loans });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            await this.deleteLoanUseCase.execute(request.params.id);
            return reply.status(204).send();
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async updateStatus(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateLoanStatusRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const loan = await this.updateLoanStatusUseCase.execute(request.params.id, request.body);
            return reply.status(200).send({ data: loan });
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    private handleError(error: Error, reply: FastifyReply) {
if (
            error.message.includes('Faltan campos requeridos') ||
            error.message.includes('obligatorio') ||
            error.message.includes('no es válido') ||
            error.message.includes('posterior') ||
            error.message.includes('ya finalized') ||
            error.message.includes('ya fue marcado')
        ) {
            return reply.status(400).send({ error: error.message });
        }

        if (error.message.includes('Cadetes tienen prohibido')) {
            return reply.status(403).send({ error: error.message });
        }

        if (error.message.includes('Tiempo límite')) {
            return reply.status(403).send({ error: error.message });
        }

        if (error.message.includes('no existe')) {
            return reply.status(404).send({ error: error.message });
        }

        return reply.status(500).send({ error: 'Error interno, reintente mas tarde' });
    }
}