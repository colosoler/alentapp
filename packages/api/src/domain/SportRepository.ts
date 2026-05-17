import { CreateSportRequest, SportDTO } from '@alentapp/shared';

export interface SportRepository {
    create(sport: CreateSportRequest): Promise<SportDTO>;
    findByName(name: string): Promise<SportDTO | null>;
}
