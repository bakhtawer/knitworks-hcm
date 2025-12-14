
import { INITIAL_EMPLOYEES, POSITIONS, INITIAL_LEAVES, INITIAL_LOANS, INITIAL_VISITORS, MOCK_USERS, generateMockAttendance } from '../constants';
import { AttendanceRecord, ProfileChangeRequest } from '../types';

// =========================================================================================
// 🔌 API CONNECTION SETTINGS
// =========================================================================================

// 1️⃣ PASTE YOUR RENDER API URL HERE (Keep the '/api' at the end)
// Example: 'https://my-app.onrender.com/api'
const RENDER_BACKEND_URL: string = 'https://knitworks-hcm.onrender.com/api'; 

// =========================================================================================

const getBaseUrl = () => {
    // Priority 1: Vercel/Vite Environment Variable
    // @ts-ignore
    if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
    
    // Priority 2: Hardcoded Render URL
    if (RENDER_BACKEND_URL && RENDER_BACKEND_URL.length > 5) {
        return RENDER_BACKEND_URL.endsWith('/') ? RENDER_BACKEND_URL.slice(0, -1) : RENDER_BACKEND_URL;
    }

    // Priority 3: Localhost (Default)
    return 'http://localhost:3001/api';
};

export const BASE_URL = getBaseUrl();
const IS_PRODUCTION_URL = BASE_URL.includes('onrender.com');

console.log(`%c🔌 Connecting to: ${BASE_URL}`, 'background: #222; color: #bada55; padding: 4px; border-radius: 4px;');

// =========================================================================================
// 🛠️ MOCK DATA STORE (FALLBACK)
// =========================================================================================
const mockStore = {
    employees: [...INITIAL_EMPLOYEES],
    positions: [...POSITIONS],
    users: [...MOCK_USERS],
    leaves: [...INITIAL_LEAVES],
    loans: [...INITIAL_LOANS],
    visitors: [...INITIAL_VISITORS],
    attendance: generateMockAttendance(INITIAL_EMPLOYEES),
    profileRequests: [] as ProfileChangeRequest[],
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleMockCall = async (method: string, endpoint: string, data?: any) => {
    // ⚠️ CRITICAL: If user is trying to connect to a real server, DO NOT silently fail to mock for write operations.
    // This ensures you know if your data is actually being saved to the DB or not.
    if (IS_PRODUCTION_URL && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        console.error(`❌ API Error: Failed to connect to ${BASE_URL}. Connection refused or timeout.`);
        throw new Error(`Connection Failed: Could not save data to Server (${BASE_URL}). Check internet or server status.`);
    }

    console.warn(`⚠️ [OFFLINE MODE] Using Mock Data for ${method} ${endpoint}`);
    await delay(500);

    // ... (Mock Logic for Demo/Offline) ...
    // --- EMPLOYEES ---
    if (endpoint.includes('/employees')) {
        if (method === 'GET') return mockStore.employees;
        if (method === 'POST') {
            const newEmp = { ...data, id: `e_mock_${Date.now()}` };
            mockStore.employees.unshift(newEmp);
            return newEmp;
        }
        if (method === 'PUT') {
            const id = endpoint.split('/').pop();
            const idx = mockStore.employees.findIndex(e => e.id === id);
            if (idx !== -1) {
                mockStore.employees[idx] = { ...mockStore.employees[idx], ...data };
                return mockStore.employees[idx];
            }
        }
    }

    // --- ATTENDANCE ---
    if (endpoint.includes('/attendance')) {
        if (method === 'GET') return mockStore.attendance;
        if (method === 'POST') {
            const { employeeId, type, time } = data;
            const today = new Date().toISOString().split('T')[0];
            const existingIdx = mockStore.attendance.findIndex(a => a.employeeId === employeeId && a.date === today);
            
            if (existingIdx !== -1) {
                if (type === 'IN') mockStore.attendance[existingIdx].checkIn = time;
                if (type === 'OUT') mockStore.attendance[existingIdx].checkOut = time;
                return mockStore.attendance[existingIdx];
            } else {
                const newRec: AttendanceRecord = {
                    id: `att_${Date.now()}`,
                    employeeId,
                    date: today,
                    status: 'Present',
                    checkIn: type === 'IN' ? time : undefined,
                    checkOut: type === 'OUT' ? time : undefined,
                    hoursWorked: 0,
                    overtimeHours: 0,
                    isShortLeave: false
                };
                mockStore.attendance.push(newRec);
                return newRec;
            }
        }
    }

    // --- POSITIONS ---
    if (endpoint.includes('/positions')) {
        if (method === 'GET') return mockStore.positions;
        if (method === 'POST') {
            const newPos = { ...data, id: `pos_${Date.now()}` };
            mockStore.positions.push(newPos);
            return newPos;
        }
        if (method === 'PUT') {
            const id = endpoint.split('/').pop();
            const idx = mockStore.positions.findIndex(p => p.id === id);
            if (idx !== -1) {
                mockStore.positions[idx] = { ...mockStore.positions[idx], ...data };
                return mockStore.positions[idx];
            }
        }
    }

    // --- USERS ---
    if (endpoint.includes('/users')) {
        if (method === 'GET') return mockStore.users;
        if (method === 'POST') {
            const newUser = { ...data, id: `u_mock_${Date.now()}` };
            mockStore.users.push(newUser);
            return newUser;
        }
    }

    // --- LEAVES ---
    if (endpoint.includes('/leaves')) {
        if (method === 'GET') return mockStore.leaves;
        if (method === 'POST') {
            const newLeave = { ...data, id: `l_mock_${Date.now()}` };
            mockStore.leaves.push(newLeave);
            return newLeave;
        }
        if (method === 'PUT') {
            const id = endpoint.split('/').pop();
            const idx = mockStore.leaves.findIndex(l => l.id === id);
            if (idx !== -1) {
                mockStore.leaves[idx] = { ...mockStore.leaves[idx], ...data };
                return mockStore.leaves[idx];
            }
        }
    }

    // --- LOANS ---
    if (endpoint.includes('/loans')) {
        if (method === 'GET') return mockStore.loans;
        if (method === 'POST') {
            const newLoan = { ...data, id: `loan_${Date.now()}` };
            mockStore.loans.push(newLoan);
            return newLoan;
        }
        if (method === 'PUT') {
            const id = endpoint.split('/').pop();
            const idx = mockStore.loans.findIndex(l => l.id === id);
            if (idx !== -1) {
                mockStore.loans[idx] = { ...mockStore.loans[idx], ...data };
                return mockStore.loans[idx];
            }
        }
    }

    // --- VISITORS ---
    if (endpoint.includes('/visitors')) {
        if (method === 'GET') return mockStore.visitors;
        if (method === 'POST') {
            const newVisitor = { ...data, id: `v_${Date.now()}` };
            mockStore.visitors.push(newVisitor);
            return newVisitor;
        }
    }

    // --- PROFILE REQUESTS ---
    if (endpoint.includes('/profile-requests')) {
        if (method === 'GET') return mockStore.profileRequests;
        if (method === 'POST') {
            const newReq = { ...data, id: `req_${Date.now()}` };
            mockStore.profileRequests.push(newReq);
            return newReq;
        }
        if (method === 'PUT') {
            const id = endpoint.split('/').pop();
            const idx = mockStore.profileRequests.findIndex(r => r.id === id);
            if (idx !== -1) {
                mockStore.profileRequests[idx] = { ...mockStore.profileRequests[idx], ...data };
                return mockStore.profileRequests[idx];
            }
        }
    }

    // --- LOGIN ---
    if (endpoint.includes('/login')) {
        const found = mockStore.users.find(u => u.username === data.username && u.password === data.password);
        if (found) return found;
        throw new Error("Invalid Credentials");
    }

    return { success: true };
};

export const api = {
    // Health Check
    checkHealth: async () => {
        try {
            const res = await fetch(`${BASE_URL}`);
            return res.ok;
        } catch {
            return false;
        }
    },

    get: async (endpoint: string) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return await res.json();
        } catch (error) {
            return handleMockCall('GET', endpoint);
        }
    },
    post: async (endpoint: string, data: any) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return await res.json();
        } catch (error) {
            return handleMockCall('POST', endpoint, data);
        }
    },
    put: async (endpoint: string, data: any) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return await res.json();
        } catch (error) {
            return handleMockCall('PUT', endpoint, data);
        }
    },
    patch: async (endpoint: string, data: any) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return await res.json();
        } catch (error) {
            return handleMockCall('PATCH', endpoint, data);
        }
    },
    delete: async (endpoint: string) => {
        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return await res.json();
        } catch (error) {
            return handleMockCall('DELETE', endpoint);
        }
    }
};
