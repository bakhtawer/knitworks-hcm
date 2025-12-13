
import React, { useState, useMemo } from 'react';
import { CheckCircle, FileSignature, FileDown } from 'lucide-react';
import { Employee, Position, UserRole } from '../types';
import { UserContext } from '../context/UserContext';
import { downloadCSV } from '../utils/helpers';

export const PayrollSystem = ({ employees, positions, attendance }: any) => {
    const { user } = React.useContext(UserContext);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [approvedBy, setApprovedBy] = useState<string | null>(null);

    // Calculation Logic
    const payrollData = useMemo(() => {
        // Mocking attendance stats aggregation for the selected month
        // In a real app, filtering `attendance` by month is needed
        return employees.map((emp: Employee) => {
            const pos = positions.find((p: Position) => p.id === emp.positionId);
            if (!pos) return null;

            // Base Calcs
            const base = pos.baseSalary;
            const customAllowances = pos.customAllowances?.reduce((sum, a) => sum + a.amount, 0) || 0;
            const gross = base + emp.medicalAllowance + emp.mobileAllowance + emp.foodAllowance + customAllowances;
            const tax = (gross * pos.taxPercentage) / 100;
            const net = gross - tax;

            return {
                id: emp.id,
                name: `${emp.firstName} ${emp.lastName}`,
                position: pos.title,
                base,
                allowances: gross - base, // Total Allowances
                gross,
                tax,
                net
            };
        }).filter(Boolean);
    }, [employees, positions, month]);

    // Comparison Logic (Simulated Last Month Variance)
    const varianceData = useMemo(() => {
        return payrollData.map((row: any) => ({
            ...row,
            prevNet: row.net * (0.95 + Math.random() * 0.1) // +/- 5% random variance
        }));
    }, [payrollData]);

    const handleApprove = () => {
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

    return (
        <div className="space-y-6">
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
                             <button onClick={handleApprove} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700">
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
        </div>
    );
};
