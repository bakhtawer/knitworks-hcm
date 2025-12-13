
import React, { useState } from 'react';
import { UserPlus, Printer } from 'lucide-react';
import { Visitor } from '../types';
import { api } from '../utils/api';

export const VisitorLog = ({ visitors, setVisitors }: { visitors: Visitor[], setVisitors: React.Dispatch<React.SetStateAction<Visitor[]>> }) => {
    const [form, setForm] = useState<Partial<Visitor>>({ name: '', cnic: '', purpose: '', checkInTime: '', badgeNumber: '' });
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const newV = { 
                ...form, 
                date: new Date().toISOString().split('T')[0] 
            };
            const saved = await api.post('/visitors', newV);
            setVisitors([...visitors, saved]);
            setIsOpen(false);
            setForm({ name: '', cnic: '', purpose: '', checkInTime: '', badgeNumber: '' });
        } catch (e) {
            alert("Failed to save visitor");
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintBadge = (v: Visitor) => {
        const w = window.open('', '', 'width=400,height=300');
        w?.document.write(`
            <div style="border:2px solid black; padding:20px; text-align:center; font-family:sans-serif;">
                <h1>VISITOR PASS</h1>
                <h2>${v.name}</h2>
                <p>Purpose: ${v.purpose}</p>
                <p>Date: ${v.date}</p>
                <h3>Badge: ${v.badgeNumber}</h3>
            </div>
        `);
        w?.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Visitor Log</h2>
                <button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <UserPlus size={18}/> Add Visitor
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">CNIC</th>
                            <th className="p-3">Purpose</th>
                            <th className="p-3">Badge</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visitors.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No visitors logged today.</td></tr>}
                        {visitors.map(v => (
                            <tr key={v.id} className="border-t">
                                <td className="p-3 font-bold">{v.name}</td>
                                <td className="p-3">{v.cnic}</td>
                                <td className="p-3">{v.purpose}</td>
                                <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded font-mono font-bold">{v.badgeNumber}</span></td>
                                <td className="p-3">
                                    <button onClick={() => handlePrintBadge(v)} className="text-blue-600 hover:underline flex items-center gap-1"><Printer size={14}/> Badge</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
                        <h3 className="font-bold text-lg">Register Visitor</h3>
                        <input className="w-full border p-2 rounded" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        <input className="w-full border p-2 rounded" placeholder="CNIC" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})} />
                        <input className="w-full border p-2 rounded" placeholder="Purpose / Host" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
                        <input className="w-full border p-2 rounded" placeholder="Badge Number" value={form.badgeNumber} onChange={e => setForm({...form, badgeNumber: e.target.value})} />
                        <button onClick={handleSubmit} disabled={isSaving} className="w-full bg-blue-600 text-white py-2 rounded font-bold">{isSaving ? 'Saving...' : 'Register'}</button>
                        <button onClick={() => setIsOpen(false)} className="w-full border py-2 rounded text-slate-500">Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};
