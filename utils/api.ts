
export const API_BASE_URL = 'http://localhost:3001/api';

// =========================================================================================
// 🌍 API CONNECTION CONFIGURATION
// =========================================================================================
// 1. Copy your Backend Web Service URL from your Render Dashboard.
// 2. Paste it into the 'RENDER_URL' variable below (keep the /api at the end).
// 3. Set 'USE_RENDER_BACKEND' to true.
// =========================================================================================

const USE_RENDER_BACKEND = true; // Set to true to use your Render URL

const RENDER_URL = 'https://knitworks-hcm.onrender.com/api'; 
const LOCAL_URL = 'http://localhost:3001/api';

// Export the selected URL
const BASE_URL = USE_RENDER_BACKEND ? RENDER_URL : LOCAL_URL;

export const api = {
    get: async (endpoint: string) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`);
            if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            throw error;
        }
    },
    post: async (endpoint: string, data: any) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error);
            throw error;
        }
    },
    put: async (endpoint: string, data: any) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`PUT ${endpoint} failed:`, error);
            throw error;
        }
    },
    patch: async (endpoint: string, data: any) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`PATCH ${endpoint} failed:`, error);
            throw error;
        }
    },
    delete: async (endpoint: string) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error(`DELETE ${endpoint} failed:`, error);
            throw error;
        }
    }
};
