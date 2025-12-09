const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// --- API ROUTES ---

// Get All Employees
app.get('/api/employees', async (req, res) => {
    const employees = await prisma.employees.findMany({
        include: { documents: true }
    });
    res.json(employees);
});

// Create Employee
app.post('/api/employees', async (req, res) => {
    try {
        const newEmp = await prisma.employees.create({
            data: req.body
        });
        res.json(newEmp);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Mark Attendance
app.post('/api/attendance', async (req, res) => {
    const { employeeId, status, checkIn } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Upsert: Update if exists, Create if not
    const record = await prisma.attendance.upsert({
        where: {
            employee_id_date: {
                employee_id: employeeId,
                date: new Date(today)
            }
        },
        update: { check_out: new Date() }, // Simplified logic
        create: {
            employee_id: employeeId,
            date: new Date(today),
            check_in: new Date(),
            status: status
        }
    });
    res.json(record);
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
});