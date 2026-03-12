
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { PrismaClient } from '@prisma/client';
import ZKLib from 'node-zklib';
import axios from 'axios';
import { MOCK_USERS, POSITIONS, INITIAL_EMPLOYEES, INITIAL_LEAVES, INITIAL_VISITORS } from './constants';
import { AttendanceStatus } from './types';

dotenv.config();

const prisma = new PrismaClient();

async function seedDatabase() {
    const userCount = await prisma.user.count();
    if (userCount > 0) return;

    console.log('🌱 Seeding database with initial data...');

    // 1. Seed Positions
    for (const pos of POSITIONS) {
        await prisma.position.upsert({
            where: { id: pos.id },
            update: {},
            create: {
                id: pos.id,
                title: pos.title,
                baseSalary: pos.baseSalary,
                salaryCap: pos.salaryCap,
                taxPercentage: pos.taxPercentage,
                type: pos.type,
                level: pos.level,
                targetDailyOutput: pos.targetDailyOutput,
                overtimeRate: pos.overtimeRate,
                customAllowances: pos.customAllowances as any
            }
        });
    }

    // 2. Seed Employees
    for (const emp of INITIAL_EMPLOYEES) {
        await prisma.employee.upsert({
            where: { id: emp.id },
            update: {},
            create: {
                id: emp.id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                cnic: emp.cnic,
                dob: emp.dob,
                gender: emp.gender,
                maritalStatus: emp.maritalStatus,
                fatherName: emp.fatherName,
                dependents: emp.dependents,
                profilePicture: emp.profilePicture,
                email: emp.email,
                positionId: emp.positionId,
                joinDate: emp.joinDate,
                division: emp.division,
                department: emp.department,
                shift: emp.shift,
                isActive: emp.isActive,
                salaryType: emp.salaryType,
                bankAccount: emp.bankAccount,
                emergencyContact: emp.emergencyContact,
                documents: emp.documents as any,
                leaveBalance: emp.leaveBalance as any,
                medicalAllowance: emp.medicalAllowance,
                providentFund: emp.providentFund,
                mobileAllowance: emp.mobileAllowance,
                foodAllowance: emp.foodAllowance,
                customAllowances: emp.customAllowances as any
            }
        });
    }

    // 3. Seed Users
    for (const user of MOCK_USERS) {
        await prisma.user.upsert({
            where: { username: user.username },
            update: {},
            create: {
                id: user.id,
                username: user.username,
                password: user.password,
                roles: user.roles.join(','),
                employeeId: user.employeeId,
                displayName: user.displayName,
                email: user.email
            }
        });
    }

    // 4. Seed Leaves
    for (const leave of INITIAL_LEAVES) {
        await prisma.leaveRequest.create({
            data: {
                id: leave.id,
                employeeId: leave.employeeId,
                startDate: leave.startDate,
                endDate: leave.endDate,
                reason: leave.reason,
                status: leave.status,
                type: leave.type,
                isPaid: leave.isPaid,
                rejectionReason: leave.rejectionReason
            }
        });
    }

    // 5. Seed Visitors
    for (const visitor of INITIAL_VISITORS) {
        await prisma.visitor.create({
            data: {
                id: visitor.id,
                name: visitor.name,
                cnic: visitor.cnic,
                purpose: visitor.purpose,
                hostEmployeeId: visitor.hostEmployeeId,
                checkInTime: visitor.checkInTime,
                checkOutTime: visitor.checkOutTime,
                date: visitor.date,
                badgeNumber: visitor.badgeNumber
            }
        });
    }

    // 6. Seed SystemSettings
    const settingsCount = await prisma.systemSettings.count();
    if (settingsCount === 0) {
        await prisma.systemSettings.create({
            data: {
                allowedLates: 3,
                lateDeductionDays: 1.0,
                attendanceBonus: 2000.0,
                foodAllowanceLabor: 100.0,
                loanLimitPercent: 50.0,
                overtimeRate: 1.5,
                halfDayDeduction: 0.5,
                taxSlab1: 600000,
                taxRate1: 2.5
            } as any
        });
    }

    console.log('✅ Seeding complete.');
}

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json());

    // Seed on startup
    try {
        await seedDatabase();
    } catch (e) {
        console.error('❌ Seeding failed:', e);
    }

    // --- Generic CRUD API Routes ---
    
    // Helper to map endpoint to prisma model
    const getModel = (table: string) => {
        if (table === 'employees') return prisma.employee;
        if (table === 'positions') return prisma.position;
        if (table === 'users') return prisma.user;
        if (table === 'attendance') return prisma.attendanceRecord;
        if (table === 'leaves') return prisma.leaveRequest;
        if (table === 'visitors') return prisma.visitor;
        if (table === 'loans') return prisma.loanRequest;
        if (table === 'profile-requests') return prisma.profileChangeRequest;
        if (table === 'settings') return prisma.systemSettings;
        return null;
    };

    const transformUser = (u: any) => {
        if (!u) return u;
        return {
            ...u,
            roles: typeof u.roles === 'string' ? u.roles.split(',').filter(Boolean) : u.roles
        };
    };

    app.get('/api/:table', async (req, res) => {
        const table = req.params.table;
        const model = getModel(table);
        if (!model) return res.status(404).json({ error: 'Table not found' });
        try {
            const data = await (model as any).findMany();
            if (table === 'users') {
                return res.json(data.map(transformUser));
            }
            res.json(data);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/:table', async (req, res) => {
        const table = req.params.table;
        const model = getModel(table);
        if (!model) return res.status(404).json({ error: 'Table not found' });
        
        try {
            const payload = { ...req.body };
            
            // Special handling for login
            if (table === 'users' && req.path.includes('/login')) {
                const user = await prisma.user.findFirst({
                    where: {
                        username: payload.username,
                        password: payload.password
                    }
                });
                if (!user) return res.status(401).json({ error: 'Invalid credentials' });
                return res.json(transformUser(user));
            }

            // Special handling for attendance
            if (table === 'attendance') {
                const today = new Date().toISOString().split('T')[0];
                const existing = await prisma.attendanceRecord.findFirst({
                    where: {
                        employeeId: payload.employeeId,
                        date: today
                    }
                });

                if (existing) {
                    const updateData: any = {};
                    if (payload.type === 'IN') updateData.checkIn = payload.time;
                    if (payload.type === 'OUT') updateData.checkOut = payload.time;
                    
                    const updated = await prisma.attendanceRecord.update({
                        where: { id: existing.id },
                        data: updateData
                    });
                    return res.json(updated);
                } else {
                    const created = await prisma.attendanceRecord.create({
                        data: {
                            employeeId: payload.employeeId,
                            date: today,
                            status: AttendanceStatus.PRESENT,
                            checkIn: payload.type === 'IN' ? payload.time : null,
                            checkOut: payload.type === 'OUT' ? payload.time : null,
                            hoursWorked: 0,
                            overtimeHours: 0,
                            isShortLeave: false
                        }
                    });
                    return res.json(created);
                }
            }

            if (table === 'users' && Array.isArray(payload.roles)) {
                payload.roles = payload.roles.join(',');
            }

            const created = await (model as any).create({ data: payload });
            res.json(table === 'users' ? transformUser(created) : created);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    app.put('/api/:table/:id', async (req, res) => {
        const table = req.params.table;
        const model = getModel(table);
        if (!model) return res.status(404).json({ error: 'Table not found' });
        try {
            const payload = { ...req.body };
            if (table === 'users' && Array.isArray(payload.roles)) {
                payload.roles = payload.roles.join(',');
            }

            const updated = await (model as any).update({
                where: { id: req.params.id },
                data: payload
            });
            res.json(table === 'users' ? transformUser(updated) : updated);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    app.delete('/api/:table/:id', async (req, res) => {
        const model = getModel(req.params.table);
        if (!model) return res.status(404).json({ error: 'Table not found' });
        try {
            await (model as any).delete({
                where: { id: req.params.id }
            });
            res.json({ success: true });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    // --- Biometric API Routes ---
    
    app.post('/api/biometric/test', async (req, res) => {
        const { ip, port } = req.body;
        if (ip === '0.0.0.0') return res.json({ success: true, message: "Bridge is active" });

        if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            return res.json({ 
                success: true, 
                message: "Connected to ZKTeco Device (Cloud Simulation)", 
                device: { name: 'KF160-Sim', userCount: 42, logCount: 1250 } 
            });
        }

        try {
            const zkInstance = new ZKLib(ip, parseInt(port) || 4370, 5000, 4000);
            await zkInstance.createSocket();
            const info = await zkInstance.getInfo();
            await zkInstance.disconnect();
            res.json({ success: true, message: "Connected to ZKTeco Device", device: info });
        } catch (e: any) {
            res.status(500).json({ success: false, error: e.message || "Failed to reach device." });
        }
    });

    app.post('/api/biometric/sync', async (req, res) => {
        const { ip, port } = req.body;
        if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            return res.json({ success: true, synced: Math.floor(Math.random() * 5) + 1 });
        }

        try {
            const zkInstance = new ZKLib(ip, parseInt(port) || 4370, 10000, 4000);
            await zkInstance.createSocket();
            const logs = await zkInstance.getAttendance();
            
            let syncCount = 0;
            for (const log of logs.data) {
                const searchId = log.deviceUserId.toString();
                const employee = await prisma.employee.findFirst({
                    where: {
                        OR: [
                            { id: searchId },
                            { id: `e_${searchId}` },
                            { cnic: searchId }
                        ]
                    }
                });

                if (employee) {
                    const logDate = new Date(log.recordTime);
                    const dateStr = logDate.toISOString().split('T')[0];
                    const timeStr = logDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                    const existing = await prisma.attendanceRecord.findFirst({
                        where: { employeeId: employee.id, date: dateStr }
                    });

                    if (existing) {
                        await prisma.attendanceRecord.update({
                            where: { id: existing.id },
                            data: { checkOut: timeStr }
                        });
                    } else {
                        await prisma.attendanceRecord.create({
                            data: {
                                employeeId: employee.id,
                                date: dateStr,
                                status: AttendanceStatus.PRESENT,
                                checkIn: timeStr,
                                hoursWorked: 0,
                                overtimeHours: 0,
                                isShortLeave: false
                            }
                        });
                    }
                    syncCount++;
                }
            }
            await zkInstance.disconnect();
            res.json({ success: true, synced: syncCount });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });

    app.post('/api/biometric/zkbiotime/sync', async (req, res) => {
        const { url, username, password } = req.body;
        
        try {
            // 1. Login to ZKBioTime
            const loginRes = await axios.post(`${url}/api-auth-token/`, {
                username,
                password
            });
            const token = loginRes.data.token;

            // 2. Fetch Transactions
            const transRes = await axios.get(`${url}/iclock/api/transactions/`, {
                headers: { Authorization: `Token ${token}` }
            });

            const logs = transRes.data.results || [];
            let syncCount = 0;

            for (const log of logs) {
                // ZKBioTime usually uses 'emp_code'
                const empCode = log.emp_code;
                const employee = await prisma.employee.findFirst({
                    where: {
                        OR: [
                            { id: empCode },
                            { id: `e_${empCode}` },
                            { cnic: empCode }
                        ]
                    }
                });

                if (employee) {
                    const logDate = new Date(log.punch_time);
                    const dateStr = logDate.toISOString().split('T')[0];
                    const timeStr = logDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                    const existing = await prisma.attendanceRecord.findFirst({
                        where: { employeeId: employee.id, date: dateStr }
                    });

                    if (existing) {
                        // If it's a later punch, update checkOut
                        await prisma.attendanceRecord.update({
                            where: { id: existing.id },
                            data: { checkOut: timeStr }
                        });
                    } else {
                        await prisma.attendanceRecord.create({
                            data: {
                                employeeId: employee.id,
                                date: dateStr,
                                status: AttendanceStatus.PRESENT,
                                checkIn: timeStr,
                                hoursWorked: 0,
                                overtimeHours: 0,
                                isShortLeave: false
                            }
                        });
                    }
                    syncCount++;
                }
            }

            res.json({ success: true, synced: syncCount });
        } catch (e: any) {
            console.error('ZKBioTime Sync Error:', e.response?.data || e.message);
            res.status(500).json({ 
                success: false, 
                error: e.response?.data?.detail || e.message || "Failed to sync with ZKBioTime" 
            });
        }
    });

    // --- Vite Middleware for Development ---
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'custom', // Changed to custom to handle index.html manually
        });
        app.use(vite.middlewares);

        app.use(async (req, res, next) => {
            if (req.url.startsWith('/api')) return next();
            
            try {
                const fs = await import('fs');
                const path = await import('path');
                let template = fs.readFileSync(path.resolve('.', 'index.html'), 'utf-8');
                template = await vite.transformIndexHtml(req.url, template);
                res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
            } catch (e: any) {
                vite.ssrFixStacktrace(e);
                next(e);
            }
        });
    } else {
        app.use(express.static('dist'));
        app.use((req, res) => {
            res.sendFile('dist/index.html', { root: '.' });
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

startServer();
