
import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, X, UserCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Employee, AttendanceRecord, Visitor, Department } from '../types';

export const Dashboard = ({ attendance, employees, visitors }: { attendance: AttendanceRecord[], employees: Employee[], visitors: Visitor[] }) => {
    const [selectedStat, setSelectedStat] = useState<'Present' | 'Late' | 'Absent' | null>(null);
    const [viewDate, setViewDate] = useState<'Today' | 'Yesterday'>('Today');

    // Filter attendance based on toggle
    const targetDate = new Date();
    if (viewDate === 'Yesterday') {
        targetDate.setDate(targetDate.getDate() - 1);
    }
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const filteredAttendance = attendance.filter((r: AttendanceRecord) => r.date === targetDateStr);

    const counts = {
        Present: filteredAttendance.filter((r:any) => r.status === 'Present').length,
        Late: filteredAttendance.filter((r:any) => r.status === 'Late' || r.status === 'HalfDay').length,
        Absent: filteredAttendance.filter((r:any) => r.status === 'Absent').length,
    };

    const getList = () => {
        if (!selectedStat) return [];
        return filteredAttendance.filter((r:any) => {
            if (selectedStat === 'Late') return r.status === 'Late' || r.status === 'HalfDay';
            return r.status === selectedStat;
        });
    };

    const activeList = getList();
    
    // Chart Data
    const pieData = [
        { name: 'Present', value: counts.Present, color: '#10b981' },
        { name: 'Late', value: counts.Late, color: '#f59e0b' },
        { name: 'Absent', value: counts.Absent, color: '#ef4444' }
    ];

    // Department Stats for Chart
    const deptStats = Object.values(Department).map(dept => {
        return {
            name: dept.split(' ')[0], // Shorten name
            present: filteredAttendance.filter((r:any) => {
                const emp = employees.find((e:Employee) => e.id === r.employeeId);
                return emp?.department === dept && r.status === 'Present';
            }).length
        };
    }).filter(d => d.present > 0).slice(0, 7); // Top 7 depts

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Overview Dashboard</h2>
                    <p className="text-slate-500">{targetDate.toDateString()}</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setViewDate('Today')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewDate === 'Today' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Today</button>
                    <button onClick={() => setViewDate('Yesterday')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewDate === 'Yesterday' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Yesterday</button>
                </div>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div 
                    onClick={() => setSelectedStat(selectedStat === 'Present' ? null : 'Present')}
                    className={`p-6 rounded-2xl shadow-lg cursor-pointer transition-all hover:scale-105 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg opacity-90">Present</h3>
                        {selectedStat === 'Present' ? <ChevronUp/> : <ChevronDown/>}
                    </div>
                    <p className="text-4xl font-bold">{counts.Present}</p>
                    <p className="text-xs opacity-75 mt-2">Employees On-site</p>
                </div>

                <div 
                    onClick={() => setSelectedStat(selectedStat === 'Late' ? null : 'Late')}
                    className={`p-6 rounded-2xl shadow-lg cursor-pointer transition-all hover:scale-105 bg-gradient-to-br from-amber-400 to-amber-600 text-white`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg opacity-90">Late</h3>
                        {selectedStat === 'Late' ? <ChevronUp/> : <ChevronDown/>}
                    </div>
                    <p className="text-4xl font-bold">{counts.Late}</p>
                    <p className="text-xs opacity-75 mt-2">Arrived after shift start</p>
                </div>

                <div 
                    onClick={() => setSelectedStat(selectedStat === 'Absent' ? null : 'Absent')}
                    className={`p-6 rounded-2xl shadow-lg cursor-pointer transition-all hover:scale-105 bg-gradient-to-br from-red-400 to-red-600 text-white`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg opacity-90">Absent</h3>
                        {selectedStat === 'Absent' ? <ChevronUp/> : <ChevronDown/>}
                    </div>
                    <p className="text-4xl font-bold">{counts.Absent}</p>
                    <p className="text-xs opacity-75 mt-2">Not checked in</p>
                </div>

                {/* Visitor Card */}
                <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg opacity-90">Active Visitors</h3>
                        <UserCheck size={20}/>
                    </div>
                    <p className="text-4xl font-bold">{visitors.length}</p>
                    <div className="text-xs mt-2 flex flex-col gap-1">
                        {visitors.slice(0, 2).map((v:Visitor) => (
                             <span key={v.id} className="opacity-80 truncate">• {v.name} (Host: {v.badgeNumber})</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expanded List */}
            {selectedStat && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800">{selectedStat} List ({viewDate})</h3>
                        <button onClick={() => setSelectedStat(null)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 text-slate-500 font-bold uppercase text-xs">Emp ID</th>
                                    <th className="p-3 text-slate-500 font-bold uppercase text-xs">Name</th>
                                    <th className="p-3 text-slate-500 font-bold uppercase text-xs">Department</th>
                                    <th className="p-3 text-slate-500 font-bold uppercase text-xs">Shift</th>
                                    <th className="p-3 text-slate-500 font-bold uppercase text-xs">Time In</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeList.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">No employees found in this category for {viewDate}.</td>
                                    </tr>
                                )}
                                {activeList.map((rec: AttendanceRecord) => {
                                    const emp = employees.find((e: Employee) => e.id === rec.employeeId);
                                    if (!emp) return null;
                                    return (
                                        <tr key={rec.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono text-slate-500">{emp.id}</td>
                                            <td className="p-3 font-bold text-slate-700">{emp.firstName} {emp.lastName}</td>
                                            <td className="p-3">{emp.department}</td>
                                            <td className="p-3 text-xs">{emp.shift.split('(')[0]}</td>
                                            <td className="p-3 font-mono">
                                                {rec.checkIn ? <span className="bg-slate-100 px-2 py-1 rounded">{rec.checkIn}</span> : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg mb-6 text-slate-700">Attendance Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={pieData} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg mb-6 text-slate-700">Department Presence</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="present" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
