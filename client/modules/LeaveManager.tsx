
import React from 'react';
import { UserRole } from '../types';
import { UserContext } from '../context/UserContext';

export const LeaveManager = ({ leaves, setLeaves }: any) => {
    const { user } = React.useContext(UserContext);
    const isHOD = user?.roles.includes(UserRole.HOD);
    // const isHR = user?.roles.includes(UserRole.HR_ADMIN);

    const handleAction = (id: string, action: 'Approve' | 'Reject') => {
        let reason = "";
        if (action === 'Reject') reason = prompt("Please enter rejection reason:") || "No reason";
        const updated = leaves.map((l:any) => l.id === id ? {...l, status: action === 'Reject' ? 'Rejected' : (isHOD && l.status === 'Pending' ? 'DeptApproved' : 'Approved'), rejectionReason: reason } : l);
        setLeaves(updated);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Leave Requests</h2>
            <div className="space-y-4">
                {leaves.map((l:any) => (
                    <div key={l.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                        <div><div className="font-bold">{l.employeeId} - {l.type}</div><div className="text-sm text-slate-500">{l.reason}</div></div>
                        <div className="flex gap-2 items-center">
                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded">{l.status}</span>
                            {l.status !== 'Approved' && l.status !== 'Rejected' && <button onClick={() => handleAction(l.id, 'Approve')} className="text-emerald-600 font-bold text-sm">Approve</button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
