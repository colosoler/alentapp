import { FastifyRequest, FastifyReply } from "fastify";
import { CreateLockerUseCase } from "../application/CreateLockerUseCase.js";
import { CreateLockerRequest, GetLockersQuery } from "../../../shared/index.js";
import { BadRequestError, ConflictError } from "../domain/services/LockerValidator.js";
import { GetLockersUseCase } from "../application/GetLockersUseCase.js";

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly getLockersUseCase: GetLockersUseCase
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
}