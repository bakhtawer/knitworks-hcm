
// =========================================================================================
// 🔌 API CONFIGURATION
// =========================================================================================
export const BASE_URL = '/api';

export const api = {
    checkHealth: async () => {
        try {
            const res = await fetch(`${BASE_URL}/users`);
            return res.ok;
        } catch {
            return false;
        }
    },

    get: async (endpoint: string) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return await res.json();
        } catch (error: any) {
            console.error(`API GET ${endpoint} failed:`, error);
            return [];
        }
    },

    post: async (endpoint: string, payload: any) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create record');
            }
            return await res.json();
        } catch (error: any) {
            console.error(`❌ API POST ${endpoint} Error:`, error);
            throw error;
        }
    },

    put: async (endpoint: string, payload: any) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update record');
            }
            return await res.json();
        } catch (error: any) {
            console.error(`❌ API PUT ${endpoint} Error:`, error);
            throw error;
        }
    },

    delete: async (endpoint: string) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete record');
            return { success: true };
        } catch (error: any) {
            console.error(`❌ API DELETE ${endpoint} Error:`, error);
            throw error;
        }
    }
};
