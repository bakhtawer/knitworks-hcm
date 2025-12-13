
import React, { useState, useMemo } from 'react';
import { Printer } from 'lucide-react';
import { Employee, AttendanceRecord, Department, ShiftType } from '../types';

export const AttendanceReports = ({ attendance, employees }: any) => {
    const [filters, setFilters] = useState({ date: new Date().toISOString().split('T')[0], dept: 'All', shift: 'All', status: 'All' });
    
    // Filter Logic
    const filteredData = useMemo(() => {
        return attendance.filter((rec: AttendanceRecord) => {
            const emp = employees.find((e: Employee) => e.id === rec.employeeId);
            if (!emp) return false;
            
            const matchDate = rec.date === filters.date;
            const matchDept = filters.dept === 'All' || emp.department === filters.dept;
            const matchShift = filters.shift === 'All' || emp.shift === filters.shift;
            const matchStatus = filters.status === 'All' || rec.status === filters.status;
            
            return matchDate && matchDept && matchShift && matchStatus;
        });
    }, [attendance, employees, filters]);

    // Stats
    const stats = {
        present: filteredData.filter((r:any) => r.status === 'Present').length,
        absent: filteredData.filter((r:any) => r.status === 'Absent').length,
        late: filteredData.filter((r:any) => r.status === 'Late').length,
        leave: filteredData.filter((r:any) => r.status === 'Leave' || r.status === 'HalfDay').length,
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end print:hidden">
                <h2 className="text-2xl font-bold text-slate-800">Attendance Report</h2>
                <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700">
                    <Printer size={18}/> Download PDF
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 print:hidden">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Date</label>
                    <input type="date" className="border p-2 rounded text-sm" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Department</label>
                    <select className="border p-2 rounded text-sm w-40" value={filters.dept} onChange={e => setFilters({...filters, dept: e.target.value})}>
                        <option value="All">All Departments</option>
                        {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Shift</label>
                    <select className="border p-2 rounded text-sm w-40" value={filters.shift} onChange={e => setFilters({...filters, shift: e.target.value})}>
                        <option value="All">All Shifts</option>
                        {Object.values(ShiftType).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Status</label>
                    <select className="border p-2 rounded text-sm w-40" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                        <option value="All">All Statuses</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                        <option value="Leave">Leave</option>
                    </select>
                </div>
            </div>

            {/* Report Summary */}
            <div className="grid grid-cols-4 gap-4 print:grid-cols-4">
                 <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                     <div className="text-sm text-emerald-600 font-bold uppercase">Present</div>
                     <div className="text-2xl font-bold text-emerald-800">{stats.present}</div>
                 </div>
                 <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                     <div className="text-sm text-red-600 font-bold uppercase">Absent</div>
                     <div className="text-2xl font-bold text-red-800">{stats.absent}</div>
                 </div>
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                     <div className="text-sm text-amber-600 font-bold uppercase">Late</div>
                     <div className="text-2xl font-bold text-amber-800">{stats.late}</div>
                 </div>
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                     <div className="text-sm text-blue-600 font-bold uppercase">On Leave</div>
                     <div className="text-2xl font-bold text-blue-800">{stats.leave}</div>
                 </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden print:border-black print:shadow-none">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 print:bg-slate-200">
                        <tr>
                            <th className="p-3">Emp ID</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Department</th>
                            <th className="p-3">Shift</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Time In</th>
                            <th className="p-3">Time Out</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-slate-400">No records found for selected filters.</td></tr>}
                        {filteredData.map((rec: AttendanceRecord) => {
                            const emp = employees.find((e: Employee) => e.id === rec.employeeId);
                            if (!emp) return null;
                            return (
                                <tr key={rec.id}>
                                    <td className="p-3 font-mono text-xs">{emp.id}</td>
                                    <td className="p-3 font-bold">{emp.firstName} {emp.lastName}</td>
                                    <td className="p-3 text-xs">{emp.department}</td>
                                    <td className="p-3 text-xs">{emp.shift.split('(')[0]}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold 
                                            ${rec.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 
                                              rec.status === 'Absent' ? 'bg-red-100 text-red-800' : 
                                              rec.status === 'Late' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {rec.status}
                                        </span>
                                    </td>
                                    <td className="p-3">{rec.checkIn || '-'}</td>
                                    <td className="p-3">{rec.checkOut || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
