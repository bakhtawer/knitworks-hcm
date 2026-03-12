
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const ZKLib = require('node-zklib');

// =========================================================================================
// 🔑 SUPABASE CONFIG (Must match your frontend)
// =========================================================================================
const SUPABASE_URL = 'https://ozumuexybyjoshznggod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dW11ZXh5Ynlqb3Noem5nZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTY0NTMsImV4cCI6MjA4MDc3MjQ1M30.FieuMVFYlYF5Zi7CawLOxmdSNFbKPrXAX8NqYuQLDLw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 🛡️ BIOMETRIC HARDWARE ACTIONS
// ==========================================

// 1. Test Connection to Device
app.post('/api/biometric/test', async (req, res) => {
    const { ip, port } = req.body;
    console.log(`📡 Attempting to connect to device at ${ip}:${port}...`);
    const zkInstance = new ZKLib(ip, parseInt(port) || 4370, 10000, 4000);
    
    try {
        await zkInstance.createSocket();
        const info = await zkInstance.getInfo();
        await zkInstance.disconnect();
        res.json({ success: true, message: "Connected to ZKTeco Device", device: info });
    } catch (e) {
        console.error("❌ ZK Connection Error:", e);
        res.status(500).json({ success: false, error: e.message || "Failed to reach device. Ensure it's on the same network." });
    }
});

// 2. Sync Attendance Logs to Supabase
app.post('/api/biometric/sync', async (req, res) => {
    const { ip, port } = req.body;
    const zkInstance = new ZKLib(ip, parseInt(port) || 4370, 10000, 4000);
    
    try {
        await zkInstance.createSocket();
        const logs = await zkInstance.getAttendance();
        console.log(`📥 Fetched ${logs.data.length} logs from device.`);
        
        let syncCount = 0;
        for (const log of logs.data) {
            // Find employee by external ID (deviceUserId)
            // Note: We match device ID with the numeric part of system ID or a custom field
            const searchId = log.deviceUserId.toString();
            
            const { data: employee } = await supabase
                .from('employees')
                .select('id')
                .or(`id.eq.e_${searchId},id.eq.${searchId}`)
                .maybeSingle();

            if (employee) {
                const logDate = new Date(log.recordTime);
                const dateStr = logDate.toISOString().split('T')[0];
                const timeStr = logDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                // Check for existing record for this employee on this date
                const { data: existing } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('employeeId', employee.id)
                    .eq('date', dateStr)
                    .maybeSingle();

                if (existing) {
                    // Update checkOut if the current log is later than existing checkIn
                    // In a real manufacturing scenario, we'd handle multiple ins/outs
                    await supabase
                        .from('attendance')
                        .update({ checkOut: timeStr })
                        .eq('id', existing.id);
                } else {
                    // Create new present record
                    await supabase
                        .from('attendance')
                        .insert([{
                            id: `att_zk_${Date.now()}_${syncCount}`,
                            employeeId: employee.id,
                            date: dateStr,
                            status: 'Present',
                            checkIn: timeStr,
                            hoursWorked: 0,
                            overtimeHours: 0,
                            isShortLeave: false
                        }]);
                }
                syncCount++;
            }
        }

        await zkInstance.disconnect();
        res.json({ success: true, synced: syncCount });
    } catch (e) {
        console.error("❌ ZK Sync Error:", e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 KnitWorks Hardware Bridge running on http://localhost:${PORT}`);
    console.log(`👉 Point your web browser app to this local address in the Face Recognition tab.`);
});
