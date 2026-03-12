
import React, { useState, useMemo } from 'react';
import { CheckCircle, FileSignature, FileDown, Ban, Check } from 'lucide-react';
import { Employee, Position, UserRole, LoanRequest, EmployeeType, AttendanceStatus, EmploymentStatus, SystemSettings } from '../types';
import { UserContext } from '../context/UserContext';
import { downloadCSV } from '../utils/helpers';
import { api } from '../utils/api';

export const PayrollSystem = ({ employees, positions, attendance, loans, setLoans }: any) => {
    const { user } = React.useContext(UserContext);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [approvedBy, setApprovedBy] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'payroll' | 'loans'>('payroll');
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    // Fetch settings
    React.useEffect(() => {
        api.get('/settings').then(data => {
            if (data && data.length > 0) setSettings(data[0]);
        });
    }, []);

    // Calculation Logic
    const payrollData = useMemo(() => {
        if (!settings) return [];

        return employees.map((emp: Employee) => {
            const pos = positions.find((p: Position) => p.id === emp.positionId);
            if (!pos) return null;

            const isProbation = emp.employmentStatus === EmploymentStatus.PROBATION;

            // 1. Base Calcs
            const base = pos.baseSalary;
            
            // 2. Custom Allowances (Disabled for Probation)
            let totalCustomAllowances = 0;
            let totalAllowanceTax = 0;

            if (!isProbation) {
                const posAllowances = pos.customAllowances || [];
                const empAllowances = emp.customAllowances || [];
                const allAllowances = [...posAllowances, ...empAllowances];

                allAllowances.forEach(a => {
                    totalCustomAllowances += a.amount;
                    if (a.taxPercentage) {
                        totalAllowanceTax += (a.amount * a.taxPercentage) / 100;
                    }
                });
            }

            // 3. Specific Allowances
            let foodAllowance = emp.foodAllowance;
            // Food Allowance for Labor only (if not already set or as additional)
            if (pos.type === EmployeeType.LABOR) {
                foodAllowance += settings.foodAllowanceLabor;
            }

            // 4. Attendance Allowance
            let attendanceBonus = 0;
            const monthAttendance = attendance?.filter((a: any) => a.employeeId === emp.id && a.date.startsWith(month)) || [];
            
            // Logic: Present on all working days (Mon-Sat)
            // For simplicity, let's say if they have at least 22 "Present" records and 0 "Absent"
            const presentCount = monthAttendance.filter((a: any) => a.status === AttendanceStatus.PRESENT).length;
            const absentCount = monthAttendance.filter((a: any) => a.status === AttendanceStatus.ABSENT).length;
            
            if (presentCount >= 22 && absentCount === 0 && !isProbation) {
                attendanceBonus = settings.attendanceBonus;
            }

            // 5. Late & Half-Day Deductions
            let lateDeduction = 0;
            let halfDayDeduction = 0;
            const lateCount = monthAttendance.filter((a: any) => a.status === AttendanceStatus.LATE).length;
            const halfDayCount = monthAttendance.filter((a: any) => a.status === AttendanceStatus.HALFDAY).length;
            
            const dailyRate = base / 30;

            if (lateCount >= settings.allowedLates) {
                const deductionMultiplier = Math.floor(lateCount / settings.allowedLates);
                lateDeduction = deductionMultiplier * dailyRate * settings.lateDeductionDays;
            }

            if (halfDayCount > 0) {
                halfDayDeduction = halfDayCount * dailyRate * settings.halfDayDeduction;
            }

            // 6. Overtime Calculation
            let overtimePay = 0;
            const totalOvertimeHours = monthAttendance.reduce((acc: number, a: any) => acc + (a.overtimeHours || 0), 0);
            if (totalOvertimeHours > 0 && pos.type === EmployeeType.LABOR) {
                const hourlyRate = base / (30 * 8); // Assuming 8h shift
                overtimePay = totalOvertimeHours * hourlyRate * settings.overtimeRate;
            }

            const gross = base + emp.medicalAllowance + emp.mobileAllowance + foodAllowance + totalCustomAllowances + attendanceBonus + overtimePay;
            
            // 7. Tax Calculation (Using System Settings)
            const annualGross = gross * 12;
            let annualTax = 0;
            if (annualGross > settings.taxSlab1) {
                annualTax = (annualGross - settings.taxSlab1) * (settings.taxRate1 / 100);
            }
            const monthlyTax = annualTax / 12;
            const totalTax = monthlyTax + totalAllowanceTax;
            
            // 8. Loans (Disabled for Probation)
            let loanDeduction = 0;
            if (!isProbation) {
                const empLoans = loans?.filter((l:LoanRequest) => l.employeeId === emp.id && l.status === 'Approved' && l.remainingBalance > 0) || [];
                loanDeduction = empLoans.reduce((acc: number, l: LoanRequest) => acc + Math.min(l.monthlyDeduction, l.remainingBalance), 0);
            }

            const net = gross - totalTax - loanDeduction - lateDeduction - halfDayDeduction;

            return {
                id: emp.id,
                name: `${emp.firstName} ${emp.lastName}`,
                position: pos.title,
                status: emp.employmentStatus,
                base,
                allowances: gross - base - overtimePay, 
                overtimePay,
                gross,
                tax: totalTax,
                loanDeduction,
                lateDeduction: lateDeduction + halfDayDeduction,
                net
            };
        }).filter(Boolean);
    }, [employees, positions, month, loans, attendance, settings]);

    // Comparison Logic (Simulated Last Month Variance)
    const varianceData = useMemo(() => {
        return payrollData.map((row: any) => ({
            ...row,
            prevNet: row.net * (0.95 + Math.random() * 0.1) // +/- 5% random variance
        }));
    }, [payrollData]);

    const handleApprovePayroll = () => {
        if (user?.roles.includes(UserRole.DIRECTOR)) {
            setApprovedBy(user.displayName);
            alert("Payroll Approved Successfully");
        } else {
            alert("Only Directors can approve payroll.");
        }
    };

    const handleRelease = () => {
        downloadCSV(payrollData, `Payroll_${month}.csv`);
    };

    const handleLoanAction = async (id: string, action: 'Approved' | 'Rejected') => {
        try {
            const updated = await api.put(`/loans/${id}`, { status: action });
            setLoans((prev: any[]) => prev.map(l => l.id === id ? updated : l));
        } catch (e: any) {
            alert("Failed to update loan: " + e.message);
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex gap-4 border-b">
                 <button onClick={() => setActiveSection('payroll')} className={`px-4 py-2 font-bold ${activeSection === 'payroll' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Monthly Payroll</button>
                 <button onClick={() => setActiveSection('loans')} className={`px-4 py-2 font-bold ${activeSection === 'loans' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Loan Management</button>
             </div>

             {activeSection === 'payroll' && (
                 <>
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payroll Month</label>
                            <input type="month" className="border p-2 rounded font-bold text-slate-700" value={month} onChange={e => setMonth(e.target.value)} />
                        </div>
                        <div className="flex gap-3">
                            {approvedBy ? (
                                <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg flex items-center gap-2 font-bold border border-emerald-200">
                                    <CheckCircle size={20}/> Approved by {approvedBy}
                                </div>
                            ) : (
                                user?.roles.includes(UserRole.DIRECTOR) && (
                                    <button onClick={handleApprovePayroll} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700">
                                        <FileSignature size={18}/> Approve Payroll
                                    </button>
                                )
                            )}
                            <button onClick={handleRelease} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700">
                                <FileDown size={18}/> Release & Download CSV
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-700">
                                <tr>
                                     <th className="p-3">Employee</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Basic</th>
                                    <th className="p-3 text-right">Allowances</th>
                                    <th className="p-3 text-right text-emerald-600">Overtime</th>
                                    <th className="p-3 text-right">Gross Pay</th>
                                    <th className="p-3 text-right">Tax</th>
                                    <th className="p-3 text-right">Deductions</th>
                                    <th className="p-3 text-right">Net Payable</th>
                                    <th className="p-3 text-right">Variance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {varianceData.map((row: any) => {
                                    const diff = row.net - row.prevNet;
                                    const totalDeductions = row.loanDeduction + row.lateDeduction;
                                    return (
                                        <tr key={row.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-bold">{row.name}</td>
                                            <td className="p-3">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${row.status === EmploymentStatus.PERMANENT ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-mono">{row.base.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono text-emerald-600">+{row.allowances.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono text-emerald-600">+{row.overtimePay.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono font-bold">{row.gross.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono text-red-500">-{row.tax.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono text-amber-600">{totalDeductions > 0 ? `-${totalDeductions.toLocaleString()}` : '-'}</td>
                                            <td className="p-3 text-right font-mono font-bold text-lg">{row.net.toLocaleString()}</td>
                                            <td className="p-3 text-right">
                                                <span className={`text-xs font-bold ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {diff > 0 ? '+' : ''}{Math.round(diff).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                 </>
             )}

             {activeSection === 'loans' && (
                 <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                     <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">Pending Loan Requests</div>
                     <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b">
                            <tr>
                                <th className="p-3">Employee</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Monthly Deduction</th>
                                <th className="p-3">Reason</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans && loans.length > 0 ? loans.map((l:any) => (
                                <tr key={l.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-bold">{l.employee?.firstName} {l.employee?.lastName}</td>
                                    <td className="p-3 font-mono">{l.amount.toLocaleString()}</td>
                                    <td className="p-3 font-mono">{l.monthlyDeduction.toLocaleString()}</td>
                                    <td className="p-3 text-slate-500">{l.reason}</td>
                                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${l.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : l.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{l.status}</span></td>
                                    <td className="p-3 flex gap-2">
                                        {l.status === 'Pending' && (
                                            <>
                                                <button onClick={() => handleLoanAction(l.id, 'Approved')} className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="Approve"><Check size={16}/></button>
                                                <button onClick={() => handleLoanAction(l.id, 'Rejected')} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Reject"><Ban size={16}/></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">No loan requests found.</td></tr>
                            )}
                        </tbody>
                     </table>
                 </div>
             )}
        </div>
    );
};
