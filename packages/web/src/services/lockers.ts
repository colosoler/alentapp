import type { CreateLockerRequest, LockerListResponse, LockerResponse } from "@alentapp/shared";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
    }
};