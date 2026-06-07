import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/CreateSportUseCase.js';
import { GetSportsUseCase } from '../application/GetSportsUseCase.js';
import { GetSportByIdUseCase } from '../application/GetSportByIdUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { UpdateSportEnrollmentCountUseCase } from '../application/UpdateSportEnrollmentCountUseCase.js';
import { DeleteSportUseCase } from '../application/DeleteSportUseCase.js';
import { CreateSportRequest, GetSportsQuery, UpdateSportRequest, UpdateSportEnrollmentCountRequest } from '@alentapp/shared';
import { requestCounter, errorCounter, requestDuration, incrementActiveRequests, decrementActiveRequests } from '../infrastructure/telemetry.js';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getSportsUseCase: GetSportsUseCase,
        private readonly getSportByIdUseCase: GetSportByIdUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly updateSportEnrollmentCountUseCase: UpdateSportEnrollmentCountUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) { }

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            requestCounter.add(1, { method, route, status: 201 });
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async getAll(
        request: FastifyRequest<{ Querystring: GetSportsQuery }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        incrementActiveRequests();
        try {
            const sports = await this.getSportsUseCase.execute(request.query);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: sports });
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
            const sport = await this.getSportByIdUseCase.execute(request.params.id);
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateSportRequest }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const sport = await this.updateSportUseCase.execute(
                request.params.id,
                request.body,
            );
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            return this.handleError(error, reply, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async updateEnrollmentCount(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdateSportEnrollmentCountRequest;
        }>,
        reply: FastifyReply,
    ) {
        const start = Date.now();
        const method = request.method;
        const route = request.url?.split('?')[0] ?? 'unknown';
        try {
            const sport = await this.updateSportEnrollmentCountUseCase.execute(
                request.params.id,
                request.body,
            );
            requestCounter.add(1, { method, route, status: 200 });
            return reply.status(200).send({ data: sport });
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
            await this.deleteSportUseCase.execute(request.params.id);
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
        if (error.message.includes('El deporte no existe')) {
            status = 404;
        } else if (
            error.message.includes('Ya existe ese deporte') ||
            error.message.includes('No hay cupo disponible') ||
            error.message.includes('No se puede eliminar un deporte con inscriptos')
        ) {
            status = 409;
        } else if (
            error.message.includes('Faltan campos requeridos') ||
            error.message.includes('El nombre del deporte es obligatorio') ||
            error.message.includes('La descripcion del deporte es obligatoria') ||
            error.message.includes('La capacidad maxima debe ser mayor a cero') ||
            error.message.includes('El precio adicional es obligatorio') ||
            error.message.includes('El precio adicional no puede ser negativo') ||
            error.message.includes('El id informado no es valido') ||
            error.message.includes('Accion de cupo invalida') ||
            error.message.includes('No se puede decrementar el cupo por debajo de cero')
        ) {
            status = 400;
        }
        errorCounter.add(1, { method, route, status });
        return reply.status(status).send({ error: status === 500 ? 'Error interno, reintente más tarde' : error.message });
    }
}
