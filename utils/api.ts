
export const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
    get: async (endpoint: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`);
            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            throw error;
        }
    },
    post: async (endpoint: string, data: any) => {
        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error);
            throw error;
        }
    },
    put: async (endpoint: string, data: any) => {
        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`PUT ${endpoint} failed:`, error);
            throw error;
        }
    },
    patch: async (endpoint: string, data: any) => {
        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`PATCH ${endpoint} failed:`, error);
            throw error;
        }
    },
    delete: async (endpoint: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`DELETE ${endpoint} failed:`, error);
            throw error;
        }
    }
};
