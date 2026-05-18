import { CreateLoanRequest, LoanDTO } from '@alentapp/shared';
import { LoanRepository } from '../domain/LoanRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { LoanValidator } from '../domain/services/LoanValidator.js';

export class CreateLoanUseCase {
    constructor(
        private readonly loanRepo: LoanRepository,
        private readonly memberRepo: MemberRepository,
        private readonly loanValidator: LoanValidator,
    ) {}

    async execute(data: CreateLoanRequest): Promise<LoanDTO> {
        this.loanValidator.validateRequiredFields(data);
        this.loanValidator.validateMemberId(data.member_id);
        this.loanValidator.validateItemName(data.item_name);

        const existingMember = await this.memberRepo.findById(data.member_id);
        if (!existingMember) {
            throw new Error('El socio especificado no existe');
        }

        if (existingMember.category === 'Cadete') {
            throw new Error('Los socios Cadetes tienen prohibido solicitar material');
        }

        const loanDate = new Date();
        this.loanValidator.validateDueDate(data.due_date, loanDate);

        return this.loanRepo.create(data);
    }
}