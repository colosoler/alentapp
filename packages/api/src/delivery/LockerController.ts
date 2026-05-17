import { FastifyRequest, FastifyReply } from "fastify";
import { CreateLockerUseCase } from "../application/CreateLockerUseCase.js";
import { CreateLockerRequest } from "../../../shared/index.js";
import { BadRequestError, ConflictError } from "../domain/services/LockerValidator.js";

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase
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
}