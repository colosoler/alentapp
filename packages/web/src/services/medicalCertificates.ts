import type {
  MedicalCertificateDTO,
  MemberMedicalCertificateStatusResponse,
} from '@alentapp/shared';

import { API_URL } from '../config';

const fetchAllCertificates = async (): Promise<MedicalCertificateDTO[]> => {
  const response = await fetch(`${API_URL}/medical-certificates`);
  if (!response.ok) {
    throw new Error('Error al obtener certificados medicos');
  }

  const result = await response.json();
  return result.data;
};

export const medicalCertificatesService = {
  async create(data: any): Promise<MedicalCertificateDTO> {
    const opts: RequestInit = {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    };

    const response = await fetch(`${API_URL}/medical-certificates`, opts);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear el certificado medico');
    }
    const result = await response.json();
    return result.data;
  },

  async update(id: string, data: any): Promise<MedicalCertificateDTO> {
    const opts: RequestInit = {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
      headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    };

    const response = await fetch(`${API_URL}/medical-certificates/${id}`, opts);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar el certificado medico');
    }

    const result = await response.json();
    return result.data;
  },

  async getAll(): Promise<MedicalCertificateDTO[]> {
    return fetchAllCertificates();
  },

  async getById(id: string): Promise<MedicalCertificateDTO> {
    const certificates = await fetchAllCertificates();
    const certificate = certificates.find((item) => item.id === id);

    if (!certificate) {
      throw new Error('El certificado no existe');
    }

    return certificate;
  },

  async getByMember(memberId: string): Promise<MedicalCertificateDTO[]> {
    const certificates = await fetchAllCertificates();
    return certificates.filter((certificate) => certificate.member_id === memberId);
  },

  async getMemberStatus(memberId: string): Promise<MemberMedicalCertificateStatusResponse> {
    const certificates = await fetchAllCertificates();
    const memberCertificates = certificates.filter((certificate) => certificate.member_id === memberId);
    const activeCertificate = memberCertificates.find((certificate) => certificate.status === 'Active');

    return {
      memberId,
      hasActiveCertificate: Boolean(activeCertificate),
      activeCertificate,
    };
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
