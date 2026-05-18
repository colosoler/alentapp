import { LoanRepository } from '../domain/LoanRepository.js';

export class DeleteLoanUseCase {
    constructor(private readonly loanRepo: LoanRepository) {}

    async execute(id: string): Promise<void> {
        const loan = await this.loanRepo.findById(id);
        if (!loan) {
            throw new Error('Préstamo no existe');
        }

        if (loan.status !== 'Loaned') {
            throw new Error('No se puede eliminar un préstamo ya finalizado');
        }

        const createdAt = new Date(loan.loan_date);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            throw new Error('Tiempo límite para eliminación excedido');
        }

        await this.loanRepo.delete(id);
    }
}