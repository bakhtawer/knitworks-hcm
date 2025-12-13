
import React, { useState } from 'react';
import { UserCog, Send } from 'lucide-react';
import { Employee, LeaveRequest, ProfileChangeRequest } from '../types';
import { UserContext } from '../context/UserContext';
import { sendEmailNotification } from '../utils/helpers';
import { api } from '../utils/api';

export const EmployeeSelfService = ({ employees, leaves, setLeaves, profileRequests, setProfileRequests }: any) => {
    const { user } = React.useContext(UserContext);
    const myEmp = employees.find((e: Employee) => e.id === user?.employeeId);
    
    const [activeTab, setActiveTab] = useState<'overview' | 'apply' | 'profile'>('overview');
    const [leaveForm, setLeaveForm] = useState({ type: 'Casual', startDate: '', endDate: '', reason: '' });
    const [profileReq, setProfileReq] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!myEmp) return <div className="p-8 text-center text-slate-400">Employee record not found for this user.</div>;

    const handleApplyLeave = async () => {
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
            
            // Notify
            sendEmailNotification(
                "hr@knitworks.com", 
                `New Leave Request: ${myEmp.firstName} ${myEmp.lastName}`, 
                `Type: ${savedLeave.type}\nReason: ${savedLeave.reason}\nDates: ${savedLeave.startDate} - ${savedLeave.endDate}`
            );

            setActiveTab('overview');
            setLeaveForm({ type: 'Casual', startDate: '', endDate: '', reason: '' });
        } catch (e: any) {
            alert("Failed to submit leave: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProfileRequest = async () => {
        if (!profileReq) return;
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
            
            // Notify
            sendEmailNotification(
                "hr@knitworks.com",
                `Profile Change Request: ${myEmp.firstName} ${myEmp.lastName}`,
                `Request Details: ${profileReq}`
            );
            setProfileReq('');
            alert("Request Submitted to HR");
        } catch (e: any) {
            alert("Failed to submit request: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">My Dashboard</h2>
            
            <div className="flex gap-4 border-b border-slate-200">
                <button onClick={() => setActiveTab('overview')} className={`pb-2 px-4 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Overview & Balances</button>
                <button onClick={() => setActiveTab('apply')} className={`pb-2 px-4 font-medium ${activeTab === 'apply' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Apply Leave</button>
                <button onClick={() => setActiveTab('profile')} className={`pb-2 px-4 font-medium ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>My Profile</button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                         <div className="text-sm opacity-80 mb-2">Casual Leaves</div>
                         <div className="text-3xl font-bold">{myEmp.leaveBalance?.cl || 0} <span className="text-sm font-normal opacity-70">Remaining</span></div>
                     </div>
                     <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                         <div className="text-sm opacity-80 mb-2">Annual Leaves</div>
                         <div className="text-3xl font-bold">{myEmp.leaveBalance?.al || 0} <span className="text-sm font-normal opacity-70">Remaining</span></div>
                     </div>
                     <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-xl shadow-lg">
                         <div className="text-sm opacity-80 mb-2">Sick Leaves</div>
                         <div className="text-3xl font-bold">{myEmp.leaveBalance?.sl || 0} <span className="text-sm font-normal opacity-70">Remaining</span></div>
                     </div>
                     <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-xl shadow-lg">
                         <div className="text-sm opacity-80 mb-2">Short Leaves</div>
                         <div className="text-3xl font-bold">{myEmp.leaveBalance?.short_leaves || 0} <span className="text-sm font-normal opacity-70">Remaining</span></div>
                     </div>

                     <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 p-6">
                         <h3 className="font-bold text-lg mb-4">Recent Leave Requests</h3>
                         <table className="w-full text-sm text-left">
                             <thead className="bg-slate-50">
                                 <tr>
                                     <th className="p-3">Type</th>
                                     <th className="p-3">Dates</th>
                                     <th className="p-3">Status</th>
                                     <th className="p-3">Reason</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {leaves.filter((l: LeaveRequest) => l.employeeId === myEmp.id).map((l: LeaveRequest) => (
                                     <tr key={l.id} className="border-b">
                                         <td className="p-3">{l.type}</td>
                                         <td className="p-3">{l.startDate}</td>
                                         <td className="p-3">
                                             <span className={`px-2 py-1 rounded text-xs font-bold ${l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                 {l.status}
                                             </span>
                                         </td>
                                         <td className="p-3 text-slate-500">{l.reason}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                </div>
            )}

            {activeTab === 'apply' && (
                <div className="bg-white p-8 rounded-xl border border-slate-200 max-w-2xl">
                    <h3 className="font-bold text-lg mb-6">Submit Leave Application</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Leave Type</label>
                            <select className="w-full border p-2 rounded" value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}>
                                <option value="Casual">Casual Leave</option>
                                <option value="Sick">Sick Leave</option>
                                <option value="Annual">Annual Leave</option>
                                <option value="ShortLeave">Short Leave</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
                                <input type="date" className="w-full border p-2 rounded" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} />
                            </div>
                            {leaveForm.type !== 'ShortLeave' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">End Date</label>
                                    <input type="date" className="w-full border p-2 rounded" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} />
                                </div>
                            )}
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">Reason</label>
                             <textarea className="w-full border p-2 rounded h-24" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} placeholder="Why are you taking this leave?" />
                        </div>
                        <button onClick={handleApplyLeave} disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold w-full hover:bg-blue-700 disabled:opacity-50">
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-lg mb-4">My Information</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Full Name</span>
                                <span className="font-bold">{myEmp.firstName} {myEmp.lastName}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">CNIC</span>
                                <span className="font-bold">{myEmp.cnic}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Email</span>
                                <span className="font-bold">{myEmp.email}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Phone</span>
                                <span className="font-bold">{myEmp.emergencyContact || 'Not Added'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Address</span>
                                <span className="font-bold">Not Added</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserCog size={20}/> Request Change</h3>
                        <p className="text-sm text-slate-500 mb-4">Found incorrect information? Submit a request to HR for correction.</p>
                        <textarea 
                            className="w-full border p-3 rounded h-32 mb-4 text-sm" 
                            placeholder="Example: Please update my mobile number to 0300-1234567..."
                            value={profileReq}
                            onChange={e => setProfileReq(e.target.value)}
                        />
                        <button onClick={handleProfileRequest} disabled={isSubmitting} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 w-full justify-center disabled:opacity-50">
                            <Send size={16}/> {isSubmitting ? 'Sending...' : 'Send Request to HR'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
