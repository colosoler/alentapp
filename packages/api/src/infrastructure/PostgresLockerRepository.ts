import { PrismaClient } from "../generated/client/index.js";
import { LockerRepository } from "../domain/LockerRepository.js";
import { LockerItemResponse, LockerResponse, LockerStatus } from "../../../shared/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBLocker = {
    id: string;
    number: number;
    location: string;
    status: LockerStatus;
    member_id: string | null;
}

export class PostgresLockerRepository implements LockerRepository {

    async existByNumber(number: number): Promise<boolean> {
        const count = await prisma.locker.count({
            where: { number }
        });
        return count > 0;
    }

    async save(locker: Omit<LockerResponse, "id">): Promise<LockerResponse> {
        const newLocker = await prisma.locker.create({
            data: {
                number: locker.number,
                location: locker.location,
                status: locker.status,
                member_id: locker.memberId
            }
        });

        return this.mapToDTO(newLocker);
    }

    private mapToDTO(dbLocker: DBLocker): LockerResponse {
        return {
            id: dbLocker.id,
            number: dbLocker.number,
            location: dbLocker.location,
            status: dbLocker.status as LockerStatus,
            memberId: dbLocker.member_id
        }
    }

    async findAll(status?: LockerStatus): Promise<LockerItemResponse[]> {
        const lockers = await prisma.locker.findMany({
            where: status ? { status } : undefined,
            include: {
                member: {
                    select: { name: true, dni: true }
                }
            },
            orderBy: { number: 'asc' }
        });

        return lockers.map(l => ({
            id: l.id,
            number: l.number,
            location: l.location,
            status: l.status as LockerStatus,
            memberId: l.member_id,
            member: l.member ? { name: l.member.name, dni: l.member.dni } : null
        }));
    }

}