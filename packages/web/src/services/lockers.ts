import type { CreateLockerRequest, LockerListResponse, LockerResponse, RentLockerRequest, UpdateLockerRequest } from "@alentapp/shared";

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const lockerService = {
    create: async (data: CreateLockerRequest): Promise<LockerResponse> => {
        const response = await fetch(`${API_URL}/lockers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Error al comunicarse con el servidor');
        }

        return response.json();
    },

    getAll: async (status?: string): Promise<LockerListResponse> => {
        const query = status ? `?status=${status}` : '';
        const response = await fetch(`${API_URL}/lockers${query}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Error al obtener los lockers');
        }

        return response.json();
    },

    rent: async (id: string, data: RentLockerRequest): Promise<LockerResponse> => {
        const response = await fetch(`${API_URL}/lockers/${id}/rent`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Error al alquilar el locker');
        }

        return response.json();
    },

    release: async (id: string): Promise<LockerResponse> => {
        const response = await fetch(`${API_URL}/lockers/${id}/release`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Error al liberar el locker');
        }

        return response.json();
    },

    update: async (id: string, data: UpdateLockerRequest): Promise<LockerResponse> => {
        const response = await fetch(`${API_URL}/lockers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Error al actualizar el locker');
        }

        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/lockers/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Error al eliminar el locker');
        }
    },

    startMaintenance: async (id: string): Promise<LockerResponse> => {
        const response = await fetch(`${API_URL}/lockers/${id}/maintenance/start`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Error al enviar a mantenimiento');
        }

        return response.json();
    },

    endMaintenance: async (id: string): Promise<LockerResponse> => {
        const response = await fetch(`${API_URL}/lockers/${id}/maintenance/end`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || 'Error al finalizar el mantenimiento');
        }

        return response.json();
    },
};