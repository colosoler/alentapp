import { SportRepository } from '../domain/SportRepository.js';

export class DeleteSportUseCase {
    constructor(private readonly sportRepo: SportRepository) {}

    async execute(id: string): Promise<void> {
        const existingSport = await this.sportRepo.findById(id);

        if (!existingSport) {
            throw new Error('El deporte no existe');
        }

        if (existingSport.current_enrollment_count > 0) {
            throw new Error('No se puede eliminar un deporte con inscriptos');
        }

        await this.sportRepo.delete(id);
    }
}