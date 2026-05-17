import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/CreateSportUseCase.js';
import { GetSportsUseCase } from '../application/GetSportsUseCase.js';
import { GetSportByIdUseCase } from '../application/GetSportByIdUseCase.js';
import { CreateSportRequest, GetSportsQuery } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly getSportByIdUseCase: GetSportByIdUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Ya existe ese deporte')) {
                return reply.status(409).send({ error: error.message });
            }

            if (
                error.message.includes('Faltan campos requeridos') ||
                error.message.includes('El nombre del deporte es obligatorio') ||
                error.message.includes('La descripcion del deporte es obligatoria') ||
                error.message.includes('La capacidad maxima debe ser mayor a cero') ||
                error.message.includes('El precio adicional es obligatorio')
            ) {
                return reply.status(400).send({ error: error.message });
            }

            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }

    async getAll(
        request: FastifyRequest<{ Querystring: GetSportsQuery }>,
        reply: FastifyReply,
    ) {
        try {
            const sports = await this.getSportsUseCase.execute(request.query);
            return reply.status(200).send({ data: sports });
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
            const sport = await this.getSportByIdUseCase.execute(request.params.id);
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('El deporte no existe')) {
                return reply.status(404).send({ error: error.message });
            }

            return reply.status(500).send({
                error: 'Error interno, reintente más tarde',
            });
        }
    }
}
