
import React, { useState, useEffect } from 'react';
import { UserCog, Send, Banknote, CheckCircle2, AlertTriangle, Check } from 'lucide-react';
import { Employee, LeaveRequest, ProfileChangeRequest, LoanRequest, EmploymentStatus } from '../types';
import { UserContext } from '../context/UserContext';
import { sendEmailNotification } from '../utils/helpers';
import { api } from '../utils/api';

export const EmployeeSelfService = ({ employees, leaves, setLeaves, profileRequests, setProfileRequests, loans, setLoans }: any) => {
    const { user } = React.useContext(UserContext);
    const myEmp = employees.find((e: Employee) => e.id === user?.employeeId);
    
    const [activeTab, setActiveTab] = useState<'overview' | 'apply' | 'loans' | 'profile'>('overview');
    const [leaveForm, setLeaveForm] = useState({ type: 'Casual', startDate: '', endDate: '', reason: '' });
    const [loanForm, setLoanForm] = useState({ amount: 0, reason: '', monthlyDeduction: 0 });
    const [profileReq, setProfileReq] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    if (!myEmp) return <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-xl border border-dashed">Employee record not found for this account. Contact HR.</div>;

    const isProbation = myEmp.employmentStatus === EmploymentStatus.PROBATION;

    const handleApplyLeave = async () => {
        if (isProbation) {
            setToast({ msg: "Leave requests are only available for Permanent employees.", type: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                employeeId: myEmp.id,
                startDate: leaveForm.startDate,
                endDate: leaveForm.endDate || leaveForm.startDate,
                reason: leaveForm.reason,
                status: 'Pending',
                type: leaveForm.type as any,
                isPaid: true
            };
            const savedLeave = await api.post('/leaves', payload);
            setLeaves([...leaves, savedLeave]);
            
            setToast({ msg: "Leave application submitted successfully!", type: 'success' });
            sendEmailNotification(
                "hr@knitworks.com", 
                `New Leave Request: ${myEmp.firstName} ${myEmp.lastName}`, 
                `Type: ${savedLeave.type}\nReason: ${savedLeave.reason}\nDates: ${savedLeave.startDate} - ${savedLeave.endDate}`
            );

            setTimeout(() => {
                setActiveTab('overview');
                setLeaveForm({ type: 'Casual', startDate: '', endDate: '', reason: '' });
            }, 1000);
        } catch (e: any) {
            setToast({ msg: "Failed: " + e.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApplyLoan = async () => {
        if (isProbation) {
            setToast({ msg: "Loan requests are only available for Permanent employees.", type: 'error' });
            return;
        }
        if (loanForm.amount <= 0 || !loanForm.reason.trim() || loanForm.monthlyDeduction <= 0) {
            setToast({ msg: "Amount, deduction and reason are mandatory.", type: 'error' });
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                employeeId: myEmp.id,
                amount: loanForm.amount,
                reason: loanForm.reason,
                monthlyDeduction: loanForm.monthlyDeduction,
                remainingBalance: loanForm.amount,
                status: 'Pending'
            };
            const savedLoan = await api.post('/loans', payload);
            if (setLoans) setLoans([...loans, savedLoan]);
            
            setToast({ msg: "Loan application sent for review.", type: 'success' });
            setLoanForm({ amount: 0, reason: '', monthlyDeduction: 0 });
            setTimeout(() => setActiveTab('overview'), 1000);
        } catch (e: any) {
            setToast({ msg: "Failed: " + e.message, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProfileRequest = async () => {
        if (!profileReq.trim()) {
            setToast({ msg: "Please describe the changes needed.", type: 'error' });
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                employeeId: myEmp.id,
                requestDate: new Date().toISOString(),
                details: profileReq,
                status: 'Pending'
            };
            const savedReq = await api.post('/profile-requests', payload);
            setProfileRequests([...profileRequests, savedReq]);
            
            setToast({ msg: "Profile change request submitted to HR.", type: 'success' });
            sendEmailNotification("hr@knitworks.com", `Profile Change Request: ${myEmp.firstName}`, `Details: ${profileReq}`);
            setProfileReq('');
        } catch (e: any) {
            setToast({ msg: "Error submitting request.", type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right-10 duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={24}/> : <AlertTriangle size={24}/>}
                    <span className="font-bold">{toast.msg}</span>
                </div>
            )}

            <h2 className="text-2xl font-bold text-slate-800">My Dashboard</h2>
            
            <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
                <button onClick={() => setActiveTab('overview')} className={`pb-2 px-4 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}>Summary & Balances</button>
                <button 
                    onClick={() => !isProbation && setActiveTab('apply')} 
                    className={`pb-2 px-4 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'apply' ? 'border-b-2 border-blue-600 text-blue-600' : isProbation ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400'}`}
                    title={isProbation ? 'Only for Permanent employees' : ''}
                >
                    Request Leave
                </button>
                <button 
                    onClick={() => !isProbation && setActiveTab('loans')} 
                    className={`pb-2 px-4 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'loans' ? 'border-b-2 border-blue-600 text-blue-600' : isProbation ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400'}`}
                    title={isProbation ? 'Only for Permanent employees' : ''}
                >
                    Finance & Loans
                </button>
                <button onClick={() => setActiveTab('profile')} className={`pb-2 px-4 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}>My Profile</button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
                     <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-100">
                         <div className="text-[10px] font-bold uppercase opacity-80 mb-2 tracking-wider">Casual Leaves</div>
                         <div className="text-3xl font-bold">{myEmp.leaveBalance?.cl || 0} <span className="text-xs font-normal opacity-70 ml-1">Days Left</span></div>
                     </div>
                     <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg shadow-purple-100">
                         <div className="text-[10px] font-bold uppercase opacity-80 mb-2 tracking-wider">Annual Leaves</div>
                         <div className="text-3xl font-bold">{myEmp.leaveBalance?.al || 0} <span className="text-xs font-normal opacity-70 ml-1">Days Left</span></div>
                     </div>
                     <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg shadow-pink-100">
                         <div className="text-[10px] font-bold uppercase opacity-80 mb-2 tracking-wider">Sick Leaves</div>
                         <div className="text-3xl font-bold">{myEmp.leaveBalance?.sl || 0} <span className="text-xs font-normal opacity-70 ml-1">Days Left</span></div>
                     </div>
                     <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-2xl shadow-lg shadow-amber-100">
                         <div className="text-[10px] font-bold uppercase opacity-80 mb-2 tracking-wider">Short Leaves</div>
                         <div className="text-3xl font-bold">{myEmp.leaveBalance?.short_leaves || 0} <span className="text-xs font-normal opacity-70 ml-1">Left</span></div>
                     </div>

                     <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                         <h3 className="font-bold text-lg mb-4 text-slate-800">Recent Applications</h3>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="p-3 font-bold uppercase text-[10px] tracking-wider">Type</th>
                                        <th className="p-3 font-bold uppercase text-[10px] tracking-wider">Dates</th>
                                        <th className="p-3 font-bold uppercase text-[10px] tracking-wider">Status</th>
                                        <th className="p-3 font-bold uppercase text-[10px] tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leaves.filter((l: LeaveRequest) => l.employeeId === myEmp.id).length === 0 && (
                                        <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">No leave history available.</td></tr>
                                    )}
                                    {leaves.filter((l: LeaveRequest) => l.employeeId === myEmp.id).map((l: LeaveRequest) => (
                                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-3 font-bold text-slate-700">{l.type}</td>
                                            <td className="p-3 text-slate-500">{l.startDate}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {l.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-400 truncate max-w-[200px]">{l.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                     </div>
                </div>
            )}

            {activeTab === 'apply' && (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-2xl shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                    <h3 className="font-bold text-xl mb-6 text-slate-800">New Leave Application</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Leave Category *</label>
                            <select className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-medium" value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}>
                                <option value="Casual">Casual Leave</option>
                                <option value="Sick">Sick Leave</option>
                                <option value="Annual">Annual Leave</option>
                                <option value="ShortLeave">Short Leave</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">From *</label>
                                <input type="date" className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} />
                            </div>
                            {leaveForm.type !== 'ShortLeave' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">To</label>
                                    <input type="date" className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} />
                                </div>
                            )}
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason for Leave *</label>
                             <textarea className="w-full border border-slate-200 p-4 rounded-xl h-32 outline-none focus:border-blue-500 text-sm" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} placeholder="Describe why you need this leave..." />
                        </div>
                        <button onClick={handleApplyLeave} disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-4 rounded-xl font-bold w-full hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                            {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={20}/>}
                            {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'loans' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                         <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-slate-800"><Banknote className="text-blue-600"/> Request New Loan</h3>
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Requested Amount *</label>
                                 <input type="number" className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-mono" value={loanForm.amount} onChange={e => setLoanForm({...loanForm, amount: parseInt(e.target.value) || 0})} placeholder="e.g. 50000"/>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Monthly Deduction *</label>
                                 <input type="number" className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-mono" value={loanForm.monthlyDeduction} onChange={e => setLoanForm({...loanForm, monthlyDeduction: parseInt(e.target.value) || 0})} placeholder="e.g. 5000"/>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Purpose of Loan *</label>
                                 <textarea className="w-full border border-slate-200 p-4 rounded-xl h-24 outline-none focus:border-blue-500 text-sm" value={loanForm.reason} onChange={e => setLoanForm({...loanForm, reason: e.target.value})} placeholder="Briefly explain your need..."/>
                             </div>
                             <button onClick={handleApplyLoan} disabled={isSubmitting} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                                 {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Check size={20}/>}
                                 {isSubmitting ? 'Sending Request...' : 'Submit Request'}
                             </button>
                         </div>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 flex flex-col">
                        <h3 className="font-bold text-lg mb-6 text-slate-800">My Loan Status</h3>
                        {(!loans || loans.filter((l:any) => l.employeeId === myEmp.id).length === 0) && (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <Banknote size={48} className="opacity-10 mb-2"/>
                                <p className="italic">No active loans or requests.</p>
                            </div>
                        )}
                        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                            {loans && loans.filter((l:any) => l.employeeId === myEmp.id).map((l: LoanRequest) => (
                                <div key={l.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group hover:border-blue-300 transition-all">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-800">Rs. {l.amount.toLocaleString()}</span>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{l.status}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-2 font-mono">
                                        <span>Balance: Rs. {l.remainingBalance.toLocaleString()}</span>
                                        <span>Ded: Rs. {l.monthlyDeduction}/mo</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic line-clamp-1">{l.reason}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-xl mb-6 text-slate-800">Account Details</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col border-b border-slate-50 pb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Full Legal Name</span>
                                <span className="font-bold text-slate-700">{myEmp.firstName} {myEmp.lastName}</span>
                            </div>
                            <div className="flex flex-col border-b border-slate-50 pb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Government ID (CNIC)</span>
                                <span className="font-bold text-slate-700 font-mono">{myEmp.cnic}</span>
                            </div>
                            <div className="flex flex-col border-b border-slate-50 pb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Email</span>
                                <span className="font-bold text-slate-700">{myEmp.email}</span>
                            </div>
                            <div className="flex flex-col border-b border-slate-50 pb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Shift Timing</span>
                                <span className="font-bold text-slate-700">{myEmp.shift}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-slate-800"><UserCog className="text-blue-600"/> Request Information Update</h3>
                        <p className="text-sm text-slate-500 mb-6">Need to update your mobile number, address, or bank details? Send a request to HR.</p>
                        <textarea 
                            className="w-full border border-slate-200 p-4 rounded-2xl h-36 mb-6 text-sm outline-none focus:border-blue-500 transition-all bg-white" 
                            placeholder="Provide details of the information that needs to be corrected..."
                            value={profileReq}
                            onChange={e => setProfileReq(e.target.value)}
                        />
                        <button onClick={handleProfileRequest} disabled={isSubmitting} className="bg-slate-800 text-white py-4 rounded-xl font-bold flex items-center gap-3 w-full justify-center hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all disabled:opacity-50">
                            {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={18}/>}
                            {isSubmitting ? 'Sending Request...' : 'Send Request to HR'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
