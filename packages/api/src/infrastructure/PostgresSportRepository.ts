import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { SportRepository } from '../domain/SportRepository.js';
import { CreateSportRequest, SportDTO } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBSport = {
    id: string;
    name: string;
    description: string;
    max_capacity: number;
    current_enrollment_count: number;
    additional_price: number;
    requires_medical_certificate: boolean;
};

export class PostgresSportRepository implements SportRepository {
    async create(data: CreateSportRequest): Promise<SportDTO> {
        const sport = await prisma.sport.create({
            data: {
                name: data.name,
                description: data.description,
                max_capacity: data.max_capacity,
                additional_price: data.additional_price,
                requires_medical_certificate: data.requires_medical_certificate,
            },
        });

        return this.mapToDTO(sport);
    }

    async findByName(name: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({
            where: { name },
        });

        return sport ? this.mapToDTO(sport) : null;
    }

    private mapToDTO(sport: DBSport): SportDTO {
        return {
            id: sport.id,
            name: sport.name,
            description: sport.description,
            max_capacity: sport.max_capacity,
            current_enrollment_count: sport.current_enrollment_count,
            additional_price: sport.additional_price,
            requires_medical_certificate: sport.requires_medical_certificate,
        };
    }
}