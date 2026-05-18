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
        try {
            const locker = await this.createLockerUseCase.execute(req.body);

            return response.status(201).send(locker);
        } catch (error: any) {

            if (error instanceof ConflictError) {
                return response.status(409).send({ error: error.message });
            }
            if (error instanceof BadRequestError) {
                return response.status(400).send({ error: error.message});
            }

            return response.status(500).send({ error: 'Internal Server Error'});
        }
    }

    async getAll(req: FastifyRequest<{ Querystring: GetLockersQuery }>, response: FastifyReply) {
        try {
            const lockers = await this.getLockersUseCase.execute(req.query.status);
            return response.status(200).send(lockers);
        } catch (error: any) {
            if (error instanceof BadRequestError) {
                return response.status(400).send({ error: error.message });
            }
            return response.status(500).send({ error: 'Internal Server Error'});
        }
    }

    async rent(req: FastifyRequest<{Params: {id: string}, Body: RentLockerRequest}>, response: FastifyReply) {
        try {
            const locker = await this.rentLockerUseCase.execute(req.params.id, req.body);
            return response.status(200).send(locker);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                return response.status(404).send({ error: error.message });
            }
            if (error instanceof BadRequestError) {
                return response.status(400).send({ error: error.message });
            }
            if (error instanceof ConflictError) {
                return response.status(409).send({ error: error.message });
            }

            console.error(error);
            return response.status(500).send({ error: 'Error interno del servidor' });
        }
    }

    async release(req: FastifyRequest<{Params: {id: string}}>, response: FastifyReply) {
        try {
            const locker = await this.releaseLockerUseCase.execute(req.params.id);
            return response.status(200).send(locker);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                return response.status(404).send({ error: error.message });
            }
            if (error instanceof ConflictError) {
                return response.status(409).send({ error: error.message });
            }
            if (error instanceof BadRequestError) {
                return response.status(400).send({ error: error.message });
            }

            console.error(error);
            return response.status(500).send({ error: 'Error interno del servidor' });
        }
    }

    async update(req: FastifyRequest<{ Params: { id: string }, Body: UpdateLockerRequest }>, response: FastifyReply) {
        try {
            const locker = await this.updateLockerUseCase.execute(req.params.id, req.body);
            return response.status(200).send(locker);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                return response.status(404).send({ error: error.message });
            }
            if (error instanceof ConflictError) {
                return response.status(409).send({ error: error.message });
            }
            if (error instanceof BadRequestError) {
                return response.status(400).send({ error: error.message });
            }
            return response.status(500).send({ error: 'Internal Server Error' });
        }
    }

    async delete(req: FastifyRequest<{ Params: { id: string } }>, response: FastifyReply) {
        try {
            await this.deleteLockerUseCase.execute(req.params.id);
            // CA 4 devolver 204 No Content
            return response.status(204).send();
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                return response.status(404).send({ error: error.message });
            }
            if (error instanceof BadRequestError) {
                return response.status(400).send({ error: error.message });
            }
            return response.status(500).send({ error: 'Internal Server Error' });
        }
    }

    async startMaintenance(req: FastifyRequest<{Params: {id: string}}>, response: FastifyReply) {
        try {
            const locker = await this.startLockerMaintenanceUseCase.execute(req.params.id);
            return response.status(200).send(locker);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                return response.status(404).send({ error: error.message });
            }
            if (error instanceof BadRequestError) {
                return response.status(400).send({ error: error.message });
            }

            console.error(error);
            return response.status(500).send({ error: 'Error interno del servidor' });
        }
    }

    async endMaintenance(req: FastifyRequest<{Params: {id: string}}>, response: FastifyReply) {
        try {
            const locker = await this.endLockerMaintenanceUseCase.execute(req.params.id);
            return response.status(200).send(locker);
        } catch (error: any) {
            if (error instanceof NotFoundError) {
                return response.status(404).send({ error: error.message });
            }
            if (error instanceof BadRequestError) {
                return response.status(400).send({ error: error.message });
            }

            console.error(error);
            return response.status(500).send({ error: 'Error interno del servidor' });
        }
    }
}