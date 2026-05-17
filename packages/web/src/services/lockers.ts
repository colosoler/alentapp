import type { CreateLockerRequest, LockerResponse } from "@alentapp/shared";

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
    }
};