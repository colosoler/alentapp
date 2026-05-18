import { SportRepository } from '../domain/SportRepository.js';
import { GetSportsQuery, SportDTO } from '@alentapp/shared';

export class GetSportsUseCase {
    constructor(private readonly sportRepo: SportRepository) {}

    async execute(query: GetSportsQuery): Promise<SportDTO[]> {
        return this.sportRepo.findAll(query);
    }
}
