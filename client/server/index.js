const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    // Real app: use bcrypt to compare hashes
    const user = await prisma.user.findUnique({
        where: { username },
        include: { employee: true }
    });

    if (user && user.passwordHash === password) { // Simulation: plain text for demo
        res.json(user);
    } else {
        res.status(401).json({ error: "Invalid credentials" });
    }
});

// --- EMPLOYEES ---
app.get('/api/employees', async (req, res) => {
    const employees = await prisma.employee.findMany({
        include: { 
            position: true,
            documents: true 
        }
    });
    res.json(employees);
});

app.post('/api/employees', async (req, res) => {
    try {
        const data = req.body;
        // Map date strings to JS Date objects
        if(data.dob) data.dob = new Date(data.dob);
        const employee = await prisma.employee.create({ data });
        res.json(employee);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    if(data.dob) data.dob = new Date(data.dob);
    const updated = await prisma.employee.update({
        where: { id },
        data
    });
    res.json(updated);
});

// --- ATTENDANCE ---
app.get('/api/attendance', async (req, res) => {
    const { date } = req.query; // YYYY-MM-DD
    const records = await prisma.attendance.findMany({
        where: date ? { date: new Date(date) } : undefined
    });
    res.json(records);
});

app.post('/api/attendance/mark', async (req, res) => {
    const { employeeId, type, time } = req.body;
    const today = new Date();
    today.setHours(0,0,0,0);

    const record = await prisma.attendance.upsert({
        where: {
            employeeId_date: {
                employeeId,
                date: today
            }
        },
        update: type === 'IN' ? { checkIn: time } : { checkOut: time },
        create: {
            employeeId,
            date: today,
            status: 'Present',
            checkIn: type === 'IN' ? time : null,
            checkOut: type === 'OUT' ? time : null
        }
    });
    res.json(record);
});

// --- POSITIONS ---
app.get('/api/positions', async (req, res) => {
    const positions = await prisma.position.findMany();
    res.json(positions);
});

app.post('/api/positions', async (req, res) => {
    const pos = await prisma.position.create({ data: req.body });
    res.json(pos);
});

// --- PAYROLL ---
app.get('/api/payroll/:month', async (req, res) => {
    const { month } = req.params; // YYYY-MM
    const payroll = await prisma.payrollEntry.findMany({
        where: { month },
        include: { employee: true }
    });
    res.json(payroll);
});

app.post('/api/payroll/approve', async (req, res) => {
    const { month, employeeId } = req.body;
    const updated = await prisma.payrollEntry.update({
        where: { employeeId_month: { employeeId, month } },
        data: { status: 'Approved' }
    });
    res.json(updated);
});

// --- VISITORS ---
app.get('/api/visitors', async (req, res) => {
    const visitors = await prisma.visitor.findMany();
    res.json(visitors);
});

app.post('/api/visitors', async (req, res) => {
    const visitor = await prisma.visitor.create({ data: req.body });
    res.json(visitor);
});

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`HCM Backend running on http://localhost:${PORT}`);
});
