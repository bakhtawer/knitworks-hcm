
export const API_BASE_URL = 'http://localhost:3001/api';

// =========================================================================================
// 🌍 API CONNECTION CONFIGURATION
// =========================================================================================
// Priority 1: Environment Variable (Vercel / Render Setting)
// Priority 2: Hardcoded Render URL (Fallback)
// Priority 3: Localhost (Development)
// =========================================================================================

// 👇 OPTIONAL: If not using Env Vars, paste your Render URL here 👇
const HARDCODED_RENDER_URL = 'https://REPLACE_THIS_WITH_YOUR_RENDER_URL.onrender.com/api'; 
const LOCAL_URL = 'http://localhost:3001/api';

const getBaseUrl = () => {
    // 1. Try Environment Variables (Vite or CRA)
    // @ts-ignore
    if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
    // @ts-ignore
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;

    // 2. Check if user has hardcoded the Render URL in this file
    const isRenderConfigured = !HARDCODED_RENDER_URL.includes('REPLACE_THIS');

    if (isRenderConfigured) {
        // Remove trailing slash if present to avoid double slashes
        const cleanUrl = HARDCODED_RENDER_URL.endsWith('/') ? HARDCODED_RENDER_URL.slice(0, -1) : HARDCODED_RENDER_URL;
        // Ensure it ends with /api
        return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
    }

    // 3. Fallback to Localhost
    return LOCAL_URL;
};

const BASE_URL = getBaseUrl();

// Debug Log (Visible in Browser Console)
console.log(`🔌 API Configured. Connected to: ${BASE_URL}`);

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
