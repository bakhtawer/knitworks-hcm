
import React, { useState, useMemo } from 'react';
import { CheckCircle, FileSignature, FileDown, Ban, Check, Scale, Clock, Calculator, AlertTriangle, Info } from 'lucide-react';
import { Employee, Position, UserRole, LoanRequest } from '../types';
import { UserContext } from '../context/UserContext';
import { downloadCSV } from '../utils/helpers';
import { api } from '../utils/api';

export const PayrollSystem = ({ employees, positions, attendance, loans, setLoans }: any) => {
    const { user } = React.useContext(UserContext);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [approvedBy, setApprovedBy] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'payroll' | 'loans' | 'policies'>('payroll');

    // Calculation Logic
    const payrollData = useMemo(() => {
        // Mocking attendance stats aggregation for the selected month
        return employees.map((emp: Employee) => {
            const pos = positions.find((p: Position) => p.id === emp.positionId);
            if (!pos) return null;

            // Base Calcs
            const base = pos.baseSalary;
            const customAllowances = pos.customAllowances?.reduce((sum, a) => sum + a.amount, 0) || 0;
            const gross = base + emp.medicalAllowance + emp.mobileAllowance + emp.foodAllowance + customAllowances;
            const tax = (gross * pos.taxPercentage) / 100;
            
            // Deduct Loans if Approved
            const empLoans = loans?.filter((l:LoanRequest) => l.employeeId === emp.id && l.status === 'Approved' && l.remainingBalance > 0) || [];
            const loanDeduction = empLoans.reduce((acc: number, l: LoanRequest) => acc + Math.min(l.monthlyDeduction, l.remainingBalance), 0);

            const net = gross - tax - loanDeduction;

            return {
                id: emp.id,
                name: `${emp.firstName} ${emp.lastName}`,
                position: pos.title,
                base,
                allowances: gross - base, // Total Allowances
                gross,
                tax,
                loanDeduction,
                net
            };
        }).filter(Boolean);
    }, [employees, positions, month, loans]);

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
                 <button onClick={() => setActiveSection('policies')} className={`px-4 py-2 font-bold ${activeSection === 'policies' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Policies & Formulas</button>
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
                                    <th className="p-3">Position</th>
                                    <th className="p-3 text-right">Basic</th>
                                    <th className="p-3 text-right">Allowances</th>
                                    <th className="p-3 text-right">Gross Pay</th>
                                    <th className="p-3 text-right">Tax</th>
                                    <th className="p-3 text-right">Loan Ded.</th>
                                    <th className="p-3 text-right">Net Payable</th>
                                    <th className="p-3 text-right">Variance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {varianceData.map((row: any) => {
                                    const diff = row.net - row.prevNet;
                                    return (
                                        <tr key={row.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-bold">{row.name}</td>
                                            <td className="p-3 text-xs text-slate-500">{row.position}</td>
                                            <td className="p-3 text-right font-mono">{row.base.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono text-emerald-600">+{row.allowances.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono font-bold">{row.gross.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono text-red-500">-{row.tax.toLocaleString()}</td>
                                            <td className="p-3 text-right font-mono text-amber-600">{row.loanDeduction > 0 ? `-${row.loanDeduction.toLocaleString()}` : '-'}</td>
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

             {activeSection === 'policies' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Formula Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calculator className="text-blue-600"/> Salary Calculation Formula
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm md:text-base text-slate-700 border border-slate-200 flex flex-wrap gap-2 items-center justify-center">
                            <span className="bg-white px-2 py-1 rounded border shadow-sm font-bold">Base Salary</span>
                            <span className="text-slate-400">+</span>
                            <span className="bg-white px-2 py-1 rounded border shadow-sm font-bold">Allowances</span>
                            <span className="text-slate-400">+</span>
                            <span className="bg-white px-2 py-1 rounded border shadow-sm font-bold">Overtime</span>
                            <span className="text-slate-400">-</span>
                            <span className="bg-white px-2 py-1 rounded border shadow-sm font-bold text-red-600">Tax</span>
                            <span className="text-slate-400">-</span>
                            <span className="bg-white px-2 py-1 rounded border shadow-sm font-bold text-red-600">Loan</span>
                            <span className="text-slate-400">-</span>
                            <span className="bg-white px-2 py-1 rounded border shadow-sm font-bold text-red-600">Late Deductions</span>
                            <span className="text-slate-400">=</span>
                            <span className="bg-blue-600 text-white px-3 py-1 rounded shadow-md font-bold">Net Salary</span>
                        </div>
                    </div>

                    {/* Attendance Policies */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock className="text-amber-600"/> Late & Attendance Policies
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1"><AlertTriangle size={16} className="text-amber-500"/></div>
                                <div>
                                    <h4 className="font-bold text-sm">Grace Period</h4>
                                    <p className="text-xs text-slate-500">Employees have a <span className="font-bold">15-minute grace period</span> after shift start time. Check-ins after this are marked as 'Late'.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1"><Scale size={16} className="text-red-500"/></div>
                                <div>
                                    <h4 className="font-bold text-sm">Late Deduction Rule</h4>
                                    <p className="text-xs text-slate-500">Every <span className="font-bold text-red-600">3rd Late</span> in a calendar month results in a deduction equivalent to <span className="font-bold">1 Day's Base Salary</span>.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1"><Clock size={16} className="text-blue-500"/></div>
                                <div>
                                    <h4 className="font-bold text-sm">Half-Day Policy</h4>
                                    <p className="text-xs text-slate-500">Check-ins occurring <span className="font-bold">more than 2 hours</span> after shift start are automatically marked as 'Half Day' (4 working hours).</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OT & Tax Policies */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Info className="text-purple-600"/> Overtime & Tax Rules
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border">
                                <h4 className="font-bold text-sm text-slate-700 mb-2">Overtime (OT) Rates</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between border-b pb-1">
                                        <span>Labor / Ops</span>
                                        <span className="font-bold text-emerald-600">1.5x Hourly Rate</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-1">
                                        <span>Management</span>
                                        <span className="font-bold text-slate-400">No OT</span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span>Sundays/Public Holidays</span>
                                        <span className="font-bold text-emerald-600">2.0x Hourly Rate</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border">
                                <h4 className="font-bold text-sm text-slate-700 mb-2">Income Tax Slabs (Annual)</h4>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span>Up to 600,000</span>
                                        <span className="font-bold">0%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>600,001 - 1,200,000</span>
                                        <span className="font-bold">2.5% of excess</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>1,200,001 - 2,400,000</span>
                                        <span className="font-bold">12.5% of excess</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400 italic mt-1">
                                        *Tax is deducted at source monthly.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
             )}
        </div>
    );
};
