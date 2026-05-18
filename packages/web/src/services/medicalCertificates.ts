import type { CreateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const medicalCertificatesService = {
  async create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
    const response = await fetch(`${API_URL}/medical-certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear el certificado medico');
    }
    const result = await response.json();
    return result.data;
  },
  async getAll(): Promise<MedicalCertificateDTO[]> {
    const response = await fetch(`${API_URL}/medical-certificates`);
    if (!response.ok) {
      throw new Error('Error al obtener certificados medicos');
    }
    const result = await response.json();
    return result.data;
  },
  async getById(id: string): Promise<MedicalCertificateDTO> {
    const response = await fetch(`${API_URL}/medical-certificates/${id}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener certificado medico');
    }
    const result = await response.json();
    return result.data;
  },
  async getByMember(memberId: string): Promise<MedicalCertificateDTO[]> {
    const response = await fetch(`${API_URL}/members/${memberId}/medical-certificates`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener certificados del socio');
    }
    const result = await response.json();
    return result.data;
  },
  async getMemberStatus(memberId: string): Promise<any> {
    const response = await fetch(`${API_URL}/members/${memberId}/medical-certificate-status`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener estado del certificado');
    }
    const result = await response.json();
    return result.data;
  },
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/medical-certificates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar el certificado medico');
    }
  },
};
