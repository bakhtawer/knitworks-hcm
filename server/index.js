
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();

// --- 1. CORS CONFIGURATION ---
// Updated to robustly handle Cross-Origin requests in production (Render)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow any origin by reflecting it back. 
    // This solves issues with 'wildcard *' when credentials are true.
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- 2. DYNAMIC PORT ---
const PORT = process.env.PORT || 3001;

// --- 3. DATABASE CONNECTION CHECK ---
async function checkDbConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to the Database via Prisma!");
  } catch (error) {
    console.error("❌ Unable to connect to the Database:");
    console.error(error.message);
  }
}
checkDbConnection();

// --- API ROUTES ---

// > EMPLOYEES
app.get('/api/employees', async (req, res) => {
    try {
        const emps = await prisma.employee.findMany({ 
            include: { position: true, documents: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(emps);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/employees', async (req, res) => {
    try {
        const data = req.body;
        // Ensure dates are valid DateTime objects
        if (data.dob) data.dob = new Date(data.dob);
        if (data.joinDate) data.joinDate = new Date(data.joinDate);
        
        const saved = await prisma.employee.create({ data });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updated = await prisma.employee.update({ where: { id }, data });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// > POSITIONS
app.get('/api/positions', async (req, res) => {
    try {
        const data = await prisma.position.findMany();
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/positions', async (req, res) => {
    try {
        const data = await prisma.position.create({ data: req.body });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// > USERS (AUTH)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // In production, compare hashed passwords!
        const user = await prisma.user.findUnique({ where: { username } });
        
        if (user && user.passwordHash === password) {
            const { passwordHash, ...userWithoutPass } = user;
            res.json(userWithoutPass);
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
    try {
        const data = req.body;
        const saved = await prisma.user.create({ data });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// > ATTENDANCE
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
        const { employeeId, type, time } = req.body; // type: 'IN' or 'OUT'
        const today = new Date();
        today.setHours(0,0,0,0);

        // Find existing record for today
        const existing = await prisma.attendance.findFirst({
            where: { employeeId, date: today }
        });

        let record;
        if (existing) {
            // Update
            record = await prisma.attendance.update({
                where: { id: existing.id },
                data: type === 'IN' ? { checkIn: time } : { checkOut: time }
            });
        } else {
            // Create
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

// > LEAVES
app.get('/api/leaves', async (req, res) => {
    try {
        const data = await prisma.leaveRequest.findMany({ include: { employee: true } });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/leaves', async (req, res) => {
    try {
        const data = req.body;
        // Dates handling
        data.startDate = new Date(data.startDate);
        data.endDate = new Date(data.endDate);
        const saved = await prisma.leaveRequest.create({ data });
        res.json(saved);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/leaves/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        const updated = await prisma.leaveRequest.update({
            where: { id },
            data: { status, rejectionReason }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// > PAYROLL
app.get('/api/payroll', async (req, res) => {
    try {
        const { month } = req.query; // YYYY-MM
        const data = await prisma.payrollRecord.findMany({
            where: { monthYear: month },
            include: { employee: true }
        });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// > VISITORS
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

// --- SERVER START ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
