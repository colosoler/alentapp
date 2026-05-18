import { CreatePaymentRequest, PaymentResponse } from '@alentapp/shared';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentValidator } from '../domain/services/PaymentValidator.js';

export class CreatePaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly memberRepository: MemberRepository,
        private readonly paymentValidator: PaymentValidator,
    ) {}

    async execute(data: CreatePaymentRequest): Promise<PaymentResponse> {
        this.paymentValidator.validateRequiredFields(data);
        this.paymentValidator.validateAmount(data.amount);
        this.paymentValidator.validateMonth(data.month);
        this.paymentValidator.validateYear(data.year);
        this.paymentValidator.validateDueDate(data.dueDate);

        const member = await this.memberRepository.findById(data.memberId);
        if (!member) {
            throw new Error('El socio especificado no existe');
        }

        return this.paymentRepository.create(data);
    }
}
