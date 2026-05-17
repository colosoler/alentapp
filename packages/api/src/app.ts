import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';
import { PostgresDisciplineRepository } from './infrastructure/PostgresDisciplineRepository.js';
import { DisciplineValidator } from './domain/services/DisciplineValidator.js';
import { CreateDisciplineUseCase } from './application/NewDisciplineUseCase.js';
import { GetDisciplineUseCase } from './application/GetDisciplineUseCase.js';
import { ListMemberDisciplinesUseCase } from './application/ListMemberDisciplinesUseCase.js';
import { GetMemberDisciplineStatusUseCase } from './application/GetMemberDisciplineStatusUseCase.js';
import { UpdateDisciplineUseCase } from './application/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from './application/DeleteDisciplineUseCase.js';
import { DisciplineController } from './delivery/DisciplineController.js';
import { PostgresLoanRepository } from './infrastructure/PostgresLoanRepository.js';
import { LoanValidator } from './domain/services/LoanValidator.js';
import { CreateLoanUseCase } from './application/CreateLoanUseCase.js';
import { GetLoansUseCase } from './application/GetLoansUseCase.js';
import { DeleteLoanUseCase } from './application/DeleteLoanUseCase.js';
import { UpdateLoanStatusUseCase } from './application/UpdateLoanStatusUseCase.js';
import { LoanController } from './delivery/LoanController.js';
import { PostgresLockerRepository } from './infrastructure/PostgresLockerRepository.js';
import { LockerValidator } from './domain/services/LockerValidator.js';
import { CreateLockerUseCase } from './application/CreateLockerUseCase.js';
import { LockerController } from './delivery/LockerController.js';
import { PostgresPaymentRepository } from './infrastructure/PostgresPaymentRepository.js';
import { PaymentValidator } from './domain/services/PaymentValidator.js';
import { CreatePaymentUseCase } from './application/CreatePaymentUseCase.js';
import { GetPaymentsUseCase } from './application/GetPaymentsUseCase.js';
import { GetPaymentByIdUseCase } from './application/GetPaymentByIdUseCase.js';
import { UpdatePaymentUseCase } from './application/UpdatePaymentUseCase.js';
import { PaymentController } from './delivery/PaymentController.js';
import { PostgresSportRepository } from './infrastructure/PostgresSportRepository.js';
import { SportValidator } from './domain/services/SportValidator.js';
import { CreateSportUseCase } from './application/CreateSportUseCase.js';
import { SportController } from './delivery/SportController.js';
import { GetSportsUseCase } from './application/GetSportsUseCase.js';
import { GetSportByIdUseCase } from './application/GetSportByIdUseCase.js';

import { GetLockersUseCase } from './application/GetLockersUseCase.js';

export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport:
                process.env.NODE_ENV === 'development'
                    ? {
                        target: 'pino-pretty',
                        options: {
                            translateTime: 'HH:MM:ss Z',
                            ignore: 'pid,hostname',
                        },
                    }
                    : undefined,
        },
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    const memberRepo = new PostgresMemberRepository();
    const memberValidator = new MemberValidator(memberRepo);
    const disciplineRepo = new PostgresDisciplineRepository();
    const disciplineValidator = new DisciplineValidator();

    const createMemberUseCase = new CreateMemberUseCase(
        memberRepo,
        memberValidator,
    );
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(
        memberRepo,
        memberValidator,
    );
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);
    const createDisciplineUseCase = new CreateDisciplineUseCase(
        disciplineRepo,
        memberRepo,
        disciplineValidator,
    );
    const getDisciplineUseCase = new GetDisciplineUseCase(
        disciplineRepo,
        disciplineValidator,
    );
    const listMemberDisciplinesUseCase = new ListMemberDisciplinesUseCase(
        disciplineRepo,
        memberRepo,
    );
    const getMemberDisciplineStatusUseCase =
        new GetMemberDisciplineStatusUseCase(disciplineRepo, memberRepo);
    const updateDisciplineUseCase = new UpdateDisciplineUseCase(
        disciplineRepo,
        disciplineValidator,
    );
    const deleteDisciplineUseCase = new DeleteDisciplineUseCase(
        disciplineRepo,
        disciplineValidator,
    );

    const loanRepo = new PostgresLoanRepository();
    const loanValidator = new LoanValidator();
    const createLoanUseCase = new CreateLoanUseCase(
        loanRepo,
        memberRepo,
        loanValidator,
    );
    const getLoansUseCase = new GetLoansUseCase(loanRepo);
    const deleteLoanUseCase = new DeleteLoanUseCase(loanRepo);
    const updateLoanStatusUseCase = new UpdateLoanStatusUseCase(loanRepo);

    const paymentRepo = new PostgresPaymentRepository();
    const paymentValidator = new PaymentValidator();
    const createPaymentUseCase = new CreatePaymentUseCase(
        paymentRepo,
        memberRepo,
        paymentValidator,
    );
    const getPaymentsUseCase = new GetPaymentsUseCase(paymentRepo);
    const getPaymentByIdUseCase = new GetPaymentByIdUseCase(paymentRepo);
    const updatePaymentUseCase = new UpdatePaymentUseCase(paymentRepo);

    const sportRepo = new PostgresSportRepository();
    const sportValidator = new SportValidator();
    const createSportUseCase = new CreateSportUseCase(
        sportRepo,
        sportValidator,
    );
    const getSportsUseCase = new GetSportsUseCase(sportRepo);
    const getSportByIdUseCase = new GetSportByIdUseCase(sportRepo);


    const memberController = new MemberController(
        createMemberUseCase,
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase,
    );
    const disciplineController = new DisciplineController(
        createDisciplineUseCase,
        getDisciplineUseCase,
        listMemberDisciplinesUseCase,
        getMemberDisciplineStatusUseCase,
        updateDisciplineUseCase,
        deleteDisciplineUseCase,
    );

    const loanController = new LoanController(
        createLoanUseCase,
        getLoansUseCase,
        deleteLoanUseCase,
        updateLoanStatusUseCase,
    );

    // instancias de locker
    const lockerRepo = new PostgresLockerRepository();
    const lockerValidator = new LockerValidator(lockerRepo);
    const createLockerUseCase = new CreateLockerUseCase(lockerRepo, lockerValidator);
    const getLockersUseCase = new GetLockersUseCase(lockerRepo)
    const lockerController = new LockerController(createLockerUseCase, getLockersUseCase);
    const sportController = new SportController(createSportUseCase, getSportsUseCase, getSportByIdUseCase);
    const paymentController = new PaymentController(
        createPaymentUseCase,
        getPaymentsUseCase,
        getPaymentByIdUseCase,
        updatePaymentUseCase,
    );

    server.get(
        '/api/v1/socios',
        memberController.getAll.bind(memberController),
    );
    server.post(
        '/api/v1/socios',
        memberController.create.bind(memberController),
    );
    server.put(
        '/api/v1/socios/:id',
        memberController.update.bind(memberController),
    );
    server.delete(
        '/api/v1/socios/:id',
        memberController.delete.bind(memberController),
    );
    server.get(
        '/api/v1/disciplines/:id',
        disciplineController.getById.bind(disciplineController),
    );
    server.post(
        '/api/v1/disciplines',
        disciplineController.create.bind(disciplineController),
    );
    server.put(
        '/api/v1/disciplines/:id',
        disciplineController.update.bind(disciplineController),
    );
    server.delete(
        '/api/v1/disciplines/:id',
        disciplineController.delete.bind(disciplineController),
    );
    server.get(
        '/api/v1/members/:memberId/disciplines',
        disciplineController.getByMember.bind(disciplineController),
    );
    server.get(
        '/api/v1/members/:memberId/discipline-status',
        disciplineController.getMemberStatus.bind(disciplineController),
    );
    server.post(
        '/api/v1/equipment-loan',
        loanController.create.bind(loanController),
    );
    server.get(
        '/api/v1/equipment-loan',
        loanController.getAll.bind(loanController),
    );
    server.delete(
        '/api/v1/equipment-loan/:id',
        loanController.delete.bind(loanController),
    );
    server.patch(
        '/api/v1/equipment-loan/:id/status',
        loanController.updateStatus.bind(loanController),
    );
    server.post(
        '/api/v1/payments',
        paymentController.create.bind(paymentController),
    );
    server.get(
        '/api/v1/payments',
        paymentController.getAll.bind(paymentController),
    );
    server.get(
        '/api/v1/payments/:id',
        paymentController.getById.bind(paymentController),
    );
    server.put(
        '/api/v1/payments/:id',
        paymentController.update.bind(paymentController),
    );
    server.post(
        '/api/v1/sports',
        sportController.create.bind(sportController),
    );
    server.get(
        '/api/v1/sports',
        sportController.getAll.bind(sportController),
    );

    server.get(
        '/api/v1/sports/:id',
        sportController.getById.bind(sportController),
    );

    // rutas de locker
    server.post('/api/v1/lockers', lockerController.create.bind(lockerController));
    server.get('/api/v1/lockers', lockerController.getAll.bind(lockerController));

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' });
    });

    return server;
}

// Solo iniciar el servidor si el script se ejecuta directamente (no cuando es importado por vitest)
if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`),
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}
