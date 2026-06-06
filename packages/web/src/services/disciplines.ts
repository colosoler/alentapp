import type {
  CreateDisciplineRequest,
  DisciplineDTO,
  MemberDisciplineStatusResponse,
  UpdateDisciplineRequest,
} from '@alentapp/shared';

import { API_URL } from '../config';

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const errorData = await response.json();
    return errorData.error || fallback;
  } catch {
    return `${fallback} (${response.status})`;
  }
}

export const disciplinesService = {
  async getById(id: string): Promise<DisciplineDTO> {
    const response = await fetch(`${API_URL}/disciplines/${id}`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al obtener la sancion'));
    }
    const result = await response.json();
    return result.data;
  },

  async getByMember(memberId: string): Promise<DisciplineDTO[]> {
    const response = await fetch(`${API_URL}/members/${memberId}/disciplines`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al obtener las sanciones'));
    }
    const result = await response.json();
    return result.data;
  },

  async getStatus(memberId: string): Promise<MemberDisciplineStatusResponse> {
    const response = await fetch(`${API_URL}/members/${memberId}/discipline-status`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al obtener el estado disciplinario'));
    }
    const result = await response.json();
    return result.data;
  },

  async create(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
    const response = await fetch(`${API_URL}/disciplines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al crear la sancion'));
    }
    const result = await response.json();
    return result.data;
  },

  async update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
    const response = await fetch(`${API_URL}/disciplines/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al actualizar la sancion'));
    }
    const result = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/disciplines/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al eliminar la sancion'));
    }
  },
};
