import type { CreateSportRequest, GetSportsQuery, UpdateSportRequest, UpdateSportEnrollmentCountRequest, SportDTO } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const sportsService = {
  async create(data: CreateSportRequest): Promise<SportDTO> {
    const response = await fetch(`${API_URL}/sports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el deporte');
    }

    const result = await response.json();
    return result.data;
  },

  async getAll(query: GetSportsQuery = {}): Promise<SportDTO[]> {
    const params = new URLSearchParams();

    if (query.name) {
      params.set('name', query.name);
    }

    const queryString = params.toString();
    const response = await fetch(`${API_URL}/sports${queryString ? `?${queryString}` : ''}`);

    if (!response.ok) {
      throw new Error('Error al obtener los deportes');
    }

    const result = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<SportDTO> {
    const response = await fetch(`${API_URL}/sports/${id}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener el deporte');
    }

    const result = await response.json();
    return result.data;
  },

  async update(id: string, data: UpdateSportRequest): Promise<SportDTO> {
    const response = await fetch(`${API_URL}/sports/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el deporte');
    }

    const result = await response.json();
    return result.data;
  },

  async updateEnrollmentCount(
    id: string,
    data: UpdateSportEnrollmentCountRequest,
  ): Promise<SportDTO> {
    const response = await fetch(`${API_URL}/sports/${id}/enrollment-count`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el cupo del deporte');
    }

    const result = await response.json();
    return result.data;
  },
};