// ==========================================
// Member
// ==========================================
export type MemberCategory = 'Pleno' | 'Cadete' | 'Honorario';
export type MemberStatus = 'Activo' | 'Moroso' | 'Suspendido';

export interface MemberDTO {
    id: string; // UUID
    dni: string;
    name: string;
    email: string;
    birthdate: string; // ISO Date String (YYYY-MM-DD)
    category: MemberCategory;
    status: MemberStatus;
    created_at: string; // ISO Date String
}

export interface CreateMemberRequest {
    dni: string;
    name: string;
    email: string;
    birthdate: string; // ISO Date String (YYYY-MM-DD)
    category: MemberCategory;
}

export interface UpdateMemberRequest {
    dni?: string;
    name?: string;
    email?: string;
    birthdate?: string; // ISO Date String (YYYY-MM-DD)
    category?: MemberCategory;
    status?: MemberStatus;
}

// ==========================================
// Discipline
// ==========================================
export interface DisciplineDTO {
    id: string; // UUID
    reason: string;
    startDate: string; // ISO Date String
    endDate: string; // ISO Date String
    isTotalSuspension: boolean;
    memberId: string;
}

export type DisciplineResponse = DisciplineDTO;

export interface CreateDisciplineRequest {
    reason: string;
    startDate: string; // ISO Date String
    endDate: string; // ISO Date String
    isTotalSuspension: boolean;
    memberId: string;
}

export interface UpdateDisciplineRequest {
    reason?: string;
    startDate?: string; // ISO Date String
    endDate?: string; // ISO Date String
    isTotalSuspension?: boolean;
}

export interface MemberDisciplineStatusResponse {
    memberId: string;
    isSuspended: boolean;
    activeTotalSuspension?: DisciplineResponse;
}

// ==========================================
// Equipment Loan
// ==========================================
export type LoanStatus = 'Loaned' | 'Returned' | 'Damaged';

export interface LoanDTO {
    id: string; // UUID
    member_id: string;
    item_name: string;
    loan_date: string; // ISO Date String
    due_date: string; // ISO Date String
    status: LoanStatus;
}

export interface CreateLoanRequest {
    member_id: string;
    item_name: string;
    due_date: string; // ISO Date String
}

export interface GetLoansQuery {
  status?: 'Loaned' | 'Returned' | 'Damaged';
  search?: string;
}

export interface LoanWithMemberDTO extends LoanDTO {
  member: {
    name: string;
  };
}

export interface UpdateLoanStatusRequest {
  status: 'Returned' | 'Damaged';
}

// ==========================================
// Payment
// ==========================================
export type PaymentStatus = 'Pending' | 'Paid' | 'Canceled';

export interface CreatePaymentRequest {
    amount: number;
    month: number; // 1–12
    year: number;
    dueDate: string; // ISO Date String (YYYY-MM-DD)
    memberId: string;
}

export interface PaymentResponse {
    id: string;
    amount: number;
    month: number;
    year: number;
    status: PaymentStatus;
    dueDate: string;
    paymentDate: string | null;
    memberId: string;
}

export interface GetPaymentsQuery {
    memberId?: string;
    status?: PaymentStatus;
    month?: number;
    year?: number;
}

export interface UpdatePaymentRequest {
    amount?: number;
    month?: number;
    year?: number;
    dueDate?: string;
    paymentDate?: string;
    status?: "Paid";
}

// ==========================================
// Locker
// ==========================================

export type LockerStatus = 'Available' | 'Maintenance' | 'Occupied';

export interface LockerResponse {
  id: string;
  number: number;
  location: string;
  status: LockerStatus;
  memberId: string | null;
}

export interface CreateLockerRequest {
  number: number;
  location: string;
  status?: 'Available' | 'Maintenance' // no puede ser occupied en la creacion
}