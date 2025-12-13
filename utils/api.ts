
export const API_BASE_URL = 'http://localhost:3001/api';

// =========================================================================================
//  API CONNECTION CONFIGURATION
// =========================================================================================
// 1. Copy your Backend Web Service URL from your Render Dashboard.
// 2. Paste it into the 'RENDER_URL' variable below.
//    Example: 'https://knitworks-hcm.onrender.com' 
//    (It works with or without the /api suffix, we handle it automatically)
// =========================================================================================

//  PASTE YOUR RENDER URL HERE 
const RENDER_URL = 'https://knitworks-hcm.onrender.com/api'; 
const LOCAL_URL = 'http://localhost:3001/api';

const getBaseUrl = () => {
    // 1. Check if user has configured the Render URL
    const isRenderConfigured = !RENDER_URL.includes('REPLACE_THIS');

    // 2. If configured, ALWAYS use Render URL (even on localhost)
    if (isRenderConfigured) {
        // Remove trailing slash if present to avoid double slashes
        const cleanUrl = RENDER_URL.endsWith('/') ? RENDER_URL.slice(0, -1) : RENDER_URL;
        
        // Ensure it ends with /api
        return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
    }

    // 3. Fallback to Localhost
    return LOCAL_URL;
};

const BASE_URL = getBaseUrl();

// Debug Log
console.log(`🔌 API Configured. Base URL: ${BASE_URL}`);

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
