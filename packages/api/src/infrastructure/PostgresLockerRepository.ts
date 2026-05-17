import { PrismaClient } from "../generated/client/index.js";
import { LockerRepository } from "../domain/LockerRepository.js";
import { LockerResponse, LockerStatus } from "../../../shared/index.js";
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

}