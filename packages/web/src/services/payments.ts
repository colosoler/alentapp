import type { CreatePaymentRequest, GetPaymentsQuery, PaymentResponse, UpdatePaymentRequest } from '@alentapp/shared';

import { API_URL } from '../config';

export const paymentsService = {
  async getAll(query?: GetPaymentsQuery): Promise<PaymentResponse[]> {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.memberId) params.set('memberId', query.memberId);
    if (query?.month) params.set('month', String(query.month));
    if (query?.year) params.set('year', String(query.year));

    const response = await fetch(`${API_URL}/payments?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Error al obtener los pagos');
    }
    const result = await response.json();
    return result.data;
  },

  async create(data: CreatePaymentRequest): Promise<PaymentResponse> {
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el pago');
    }

    const result = await response.json();
    return result.data;
  },

  async update(id: string, data: UpdatePaymentRequest): Promise<PaymentResponse> {
    const response = await fetch(`${API_URL}/payments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el pago');
    }

    const result = await response.json();
    return result.data;
  },

  async cancel(id: string): Promise<PaymentResponse> {
    const response = await fetch(`${API_URL}/payments/${id}/cancel`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cancelar el pago');
    }

    const result = await response.json();
    return result.data;
  },
};