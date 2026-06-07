import { FastifyRequest, FastifyReply } from "fastify";
import { CreateLockerUseCase } from "../application/CreateLockerUseCase.js";
import { CreateLockerRequest, GetLockersQuery, RentLockerRequest, UpdateLockerRequest } from "../../../shared/index.js";
import { BadRequestError, ConflictError, NotFoundError } from "../domain/services/LockerValidator.js";
import { GetLockersUseCase } from "../application/GetLockersUseCase.js";
import { RentLockerUseCase } from "../application/RentLockerUseCase.js";
import { ReleaseLockerUseCase } from "../application/ReleaseLockerUseCase.js";
import { UpdateLockerUseCase } from "../application/UpdateLockerUseCase.js";
import { DeleteLockerUseCase } from "../application/DeleteLockerUseCase.js";
import { StartLockerMaintenanceUseCase } from "../application/StartLockerMaintenanceUseCase.js";
import { EndLockerMaintenanceUseCase } from "../application/EndLockerMaintenanceUseCase.js";
import { requestCounter, errorCounter, requestDuration, incrementActiveRequests, decrementActiveRequests } from "../infrastructure/telemetry.js";

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase,
        private readonly rentLockerUseCase: RentLockerUseCase,
        private readonly releaseLockerUseCase: ReleaseLockerUseCase,
        private readonly updateLockerUseCase: UpdateLockerUseCase,
        private readonly deleteLockerUseCase: DeleteLockerUseCase,
        private readonly startLockerMaintenanceUseCase: StartLockerMaintenanceUseCase,
        private readonly endLockerMaintenanceUseCase: EndLockerMaintenanceUseCase,
    ) {}

    async create(req: FastifyRequest<{Body: CreateLockerRequest}>, response: FastifyReply) {
        const start = Date.now();
        const method = req.method;
        const route = req.url?.split('?')[0] ?? 'unknown';
        try {
            const locker = await this.createLockerUseCase.execute(req.body);
            requestCounter.add(1, { method, route, status: 201 });
            return response.status(201).send(locker);
        } catch (error: any) {
            return this.handleError(error, response, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async getAll(req: FastifyRequest<{ Querystring: GetLockersQuery }>, response: FastifyReply) {
        const start = Date.now();
        const method = req.method;
        const route = req.url?.split('?')[0] ?? 'unknown';
        incrementActiveRequests();
        try {
            const lockers = await this.getLockersUseCase.execute(req.query.status);
            requestCounter.add(1, { method, route, status: 200 });
            return response.status(200).send(lockers);
        } catch (error: any) {
            return this.handleError(error, response, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
            decrementActiveRequests();
        }
    }

    async rent(req: FastifyRequest<{Params: {id: string}, Body: RentLockerRequest}>, response: FastifyReply) {
        const start = Date.now();
        const method = req.method;
        const route = req.url?.split('?')[0] ?? 'unknown';
        try {
            const locker = await this.rentLockerUseCase.execute(req.params.id, req.body);
            requestCounter.add(1, { method, route, status: 200 });
            return response.status(200).send(locker);
        } catch (error: any) {
            return this.handleError(error, response, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async release(req: FastifyRequest<{Params: {id: string}}>, response: FastifyReply) {
        const start = Date.now();
        const method = req.method;
        const route = req.url?.split('?')[0] ?? 'unknown';
        try {
            const locker = await this.releaseLockerUseCase.execute(req.params.id);
            requestCounter.add(1, { method, route, status: 200 });
            return response.status(200).send(locker);
        } catch (error: any) {
            return this.handleError(error, response, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async update(req: FastifyRequest<{ Params: { id: string }, Body: UpdateLockerRequest }>, response: FastifyReply) {
        const start = Date.now();
        const method = req.method;
        const route = req.url?.split('?')[0] ?? 'unknown';
        try {
            const locker = await this.updateLockerUseCase.execute(req.params.id, req.body);
            requestCounter.add(1, { method, route, status: 200 });
            return response.status(200).send(locker);
        } catch (error: any) {
            return this.handleError(error, response, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async delete(req: FastifyRequest<{ Params: { id: string } }>, response: FastifyReply) {
        const start = Date.now();
        const method = req.method;
        const route = req.url?.split('?')[0] ?? 'unknown';
        try {
            await this.deleteLockerUseCase.execute(req.params.id);
            requestCounter.add(1, { method, route, status: 204 });
            return response.status(204).send();
        } catch (error: any) {
            return this.handleError(error, response, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async startMaintenance(req: FastifyRequest<{Params: {id: string}}>, response: FastifyReply) {
        const start = Date.now();
        const method = req.method;
        const route = req.url?.split('?')[0] ?? 'unknown';
        try {
            const locker = await this.startLockerMaintenanceUseCase.execute(req.params.id);
            requestCounter.add(1, { method, route, status: 200 });
            return response.status(200).send(locker);
        } catch (error: any) {
            return this.handleError(error, response, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    async endMaintenance(req: FastifyRequest<{Params: {id: string}}>, response: FastifyReply) {
        const start = Date.now();
        const method = req.method;
        const route = req.url?.split('?')[0] ?? 'unknown';
        try {
            const locker = await this.endLockerMaintenanceUseCase.execute(req.params.id);
            requestCounter.add(1, { method, route, status: 200 });
            return response.status(200).send(locker);
        } catch (error: any) {
            return this.handleError(error, response, method, route);
        } finally {
            requestDuration.record(Date.now() - start, { method, route });
        }
    }

    private handleError(error: Error, response: FastifyReply, method: string, route: string) {
        let status = 500;
        if (error instanceof NotFoundError) {
            status = 404;
        } else if (error instanceof ConflictError) {
            status = 409;
        } else if (error instanceof BadRequestError) {
            status = 400;
        }
        errorCounter.add(1, { method, route, status });
        console.error(error);
        return response.status(status).send({ error: status === 500 ? 'Error interno del servidor' : error.message });
    }
}
