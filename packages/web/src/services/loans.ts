import type { LoanDTO, CreateLoanRequest, LoanWithMemberDTO, GetLoansQuery, UpdateLoanStatusRequest } from '@alentapp/shared';
import { API_URL } from '../config';

export const loansService = {
  async create(data: CreateLoanRequest): Promise<LoanDTO> {
    const response = await fetch(`${API_URL}/equipment-loan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el préstamo');
    }
    const result = await response.json();
    return result.data;
  },

  async getAll(query?: GetLoansQuery): Promise<LoanWithMemberDTO[]> {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.search) params.set('search', query.search);

    const response = await fetch(`${API_URL}/equipment-loan?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Error al obtener los préstamos');
    }
    const result = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/equipment-loan/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar el préstamo');
    }
  },

  async updateStatus(id: string, data: UpdateLoanStatusRequest): Promise<LoanDTO> {
    const response = await fetch(`${API_URL}/equipment-loan/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el estado');
    }
    const result = await response.json();
    return result.data;
  },
};