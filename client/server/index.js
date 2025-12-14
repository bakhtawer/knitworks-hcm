
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();

// --- 1. CONFIGURATION ---
// Allow all origins for easier development connectivity
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- 2. ROOT ROUTES ---
app.get('/', (req, res) => {
    res.send('KnitWorks HCM Backend is Running. Access API at /api');
});

// Health check endpoint
app.get('/api', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'KnitWorks HCM API is ready' });
});

// --- 3. MODULE API ROUTES ---

// ==========================================
// 👥 EMPLOYEES
// ==========================================
app.get('/api/employees', async (req, res) => {
    try {
        const emps = await prisma.employee.findMany({ 
            include: { position: true, documents: true },
            orderBy: { createdAt: 'desc' }
        });
        const parsed = emps.map(e => ({
            ...e,
            leaveBalance: e.leaveBalance ? JSON.parse(e.leaveBalance) : {},
        }));
        res.json(parsed);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/employees', async (req, res) => {
    try {
        const data = req.body;
        if (data.dob) data.dob = new Date(data.dob);
        if (data.joinDate) data.joinDate = new Date(data.joinDate);
        if (data.leaveBalance) data.leaveBalance = JSON.stringify(data.leaveBalance);
        if (data.documents) delete data.documents; 
        
        const saved = await prisma.employee.create({ data });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        if (data.leaveBalance && typeof data.leaveBalance === 'object') {
            data.leaveBalance = JSON.stringify(data.leaveBalance);
        }
        delete data.documents;
        delete data.position;
        const updated = await prisma.employee.update({ where: { id }, data });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await prisma.employee.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 👔 POSITIONS
// ==========================================
app.get('/api/positions', async (req, res) => {
    try {
        const data = await prisma.position.findMany();
        const parsed = data.map(p => ({
            ...p,
            customAllowances: p.customAllowances ? JSON.parse(p.customAllowances) : []
        }));
        res.json(parsed);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/positions', async (req, res) => {
    try {
        const data = req.body;
        if (data.customAllowances) data.customAllowances = JSON.stringify(data.customAllowances);
        const saved = await prisma.position.create({ data });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/positions/:id', async (req, res) => {
    try {
        const data = req.body;
        if (data.customAllowances) data.customAllowances = JSON.stringify(data.customAllowances);
        const updated = await prisma.position.update({ where: { id: req.params.id }, data });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/positions/:id', async (req, res) => {
    try {
        await prisma.position.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 🔐 USERS & AUTH
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });
        if (user && user.passwordHash === password) {
            const roles = user.roles ? user.roles.split(',') : [];
            res.json({ ...user, roles });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        const parsed = users.map(u => ({ ...u, roles: u.roles ? u.roles.split(',') : [] }));
        res.json(parsed);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
    try {
        const data = req.body;
        const passwordHash = data.password;
        delete data.password;
        
        const userData = {
            ...data,
            passwordHash,
            roles: Array.isArray(data.roles) ? data.roles.join(',') : data.roles
        };
        const saved = await prisma.user.create({ data: userData });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const data = req.body;
        if (data.password) {
             data.passwordHash = data.password;
             delete data.password;
        }
        if (data.roles && Array.isArray(data.roles)) {
            data.roles = data.roles.join(',');
        }
        const updated = await prisma.user.update({ where: { id: req.params.id }, data });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 📅 ATTENDANCE
// ==========================================
app.get('/api/attendance', async (req, res) => {
    try {
        const { date, employeeId } = req.query;
        const where = {};
        if (date) where.date = new Date(date);
        if (employeeId) where.employeeId = employeeId;
        const data = await prisma.attendance.findMany({ where });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/attendance', async (req, res) => {
    try {
        const { employeeId, type, time } = req.body;
        const today = new Date();
        today.setHours(0,0,0,0);

        const existing = await prisma.attendance.findFirst({
            where: { employeeId, date: { gte: today } }
        });

        let record;
        if (existing) {
            record = await prisma.attendance.update({
                where: { id: existing.id },
                data: type === 'IN' ? { checkIn: time } : { checkOut: time }
            });
        } else {
            record = await prisma.attendance.create({
                data: {
                    employeeId,
                    date: today,
                    status: 'Present',
                    checkIn: type === 'IN' ? time : null,
                    checkOut: type === 'OUT' ? time : null
                }
            });
        }
        res.json(record);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 📝 LEAVES
// ==========================================
app.get('/api/leaves', async (req, res) => {
    try {
        const data = await prisma.leaveRequest.findMany({ include: { employee: true } });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/leaves', async (req, res) => {
    try {
        const data = req.body;
        data.startDate = new Date(data.startDate);
        data.endDate = new Date(data.endDate);
        const saved = await prisma.leaveRequest.create({ data });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/leaves/:id', async (req, res) => {
    try {
        const updated = await prisma.leaveRequest.update({ 
            where: { id: req.params.id }, 
            data: req.body 
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 👤 VISITORS
// ==========================================
app.get('/api/visitors', async (req, res) => {
    try {
        const data = await prisma.visitor.findMany();
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/visitors', async (req, res) => {
    try {
        const data = req.body;
        const saved = await prisma.visitor.create({ data });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/visitors/:id', async (req, res) => {
    try {
        const updated = await prisma.visitor.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 🔄 PROFILE REQUESTS
// ==========================================
app.get('/api/profile-requests', async (req, res) => {
    try {
        const data = await prisma.profileChangeRequest.findMany({ include: { employee: true } });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/profile-requests', async (req, res) => {
    try {
        const data = req.body;
        data.requestDate = new Date(data.requestDate);
        const saved = await prisma.profileChangeRequest.create({ data });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/profile-requests/:id', async (req, res) => {
    try {
        const updated = await prisma.profileChangeRequest.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 💰 LOANS
// ==========================================
app.get('/api/loans', async (req, res) => {
    try {
        const data = await prisma.loanRequest.findMany({ include: { employee: true } });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/loans', async (req, res) => {
    try {
        const data = req.body;
        data.requestDate = new Date();
        const saved = await prisma.loanRequest.create({ data });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/loans/:id', async (req, res) => {
    try {
        const updated = await prisma.loanRequest.update({ where: { id: req.params.id }, data: req.body });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// 🏭 PRODUCTION
// ==========================================
app.get('/api/production', async (req, res) => {
    try {
        const data = await prisma.productionRecord.findMany();
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/production', async (req, res) => {
    try {
        const data = req.body;
        data.date = new Date(data.date);
        const saved = await prisma.productionRecord.create({ data });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- 4. DEBUG CATCH-ALL ---
app.use('*', (req, res) => {
    console.warn(`⚠️ 404 URL MISMATCH: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        error: `Route not found: ${req.originalUrl}`,
        hint: "Did you forget the '/api' prefix in your frontend BASE_URL?" 
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
