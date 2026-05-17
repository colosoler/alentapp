import { CreateSportRequest, SportDTO, UpdateSportRequest, GetSportsQuery } from '@alentapp/shared';

export interface SportRepository {
    create(sport: CreateSportRequest): Promise<SportDTO>;
    findByName(name: string): Promise<SportDTO | null>;
    findById(id: string): Promise<SportDTO | null>;
    findAll(query?: GetSportsQuery): Promise<SportDTO[]>;
    update(id: string, data: UpdateSportRequest): Promise<SportDTO>;
}
