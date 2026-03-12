
import React, { useState, useEffect } from 'react';
import { UserPlus, Printer, CheckCircle2, AlertTriangle, Check } from 'lucide-react';
import { Visitor } from '../types';
import { api } from '../utils/api';

export const VisitorLog = ({ visitors, setVisitors }: { visitors: Visitor[], setVisitors: React.Dispatch<React.SetStateAction<Visitor[]>> }) => {
    const [form, setForm] = useState<Partial<Visitor>>({ name: '', cnic: '', purpose: '', checkInTime: '', badgeNumber: '' });
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const validateForm = () => {
        const newErrors: Record<string, boolean> = {};
        if (!form.name?.trim()) newErrors.name = true;
        if (!form.purpose?.trim()) newErrors.purpose = true;
        if (!form.badgeNumber?.trim()) newErrors.badgeNumber = true;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setToast({ msg: "Name, Purpose, and Badge Number are required.", type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const newV = { 
                ...form, 
                date: new Date().toISOString().split('T')[0],
                checkInTime: form.checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            const saved = await api.post('/visitors', newV);
            setVisitors([...visitors, saved]);
            setToast({ msg: "Visitor registered successfully!", type: 'success' });
            setTimeout(() => setIsOpen(false), 800);
            setForm({ name: '', cnic: '', purpose: '', checkInTime: '', badgeNumber: '' });
        } catch (e) {
            setToast({ msg: "Failed to save visitor", type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintBadge = (v: Visitor) => {
        const w = window.open('', '', 'width=400,height=300');
        w?.document.write(`
            <div style="border:4px solid black; padding:30px; text-align:center; font-family:sans-serif;">
                <h1 style="margin:0; font-size:32px;">VISITOR PASS</h1>
                <hr style="margin:20px 0; border:1px solid #ddd;"/>
                <h2 style="font-size:24px; margin-bottom:5px;">${v.name}</h2>
                <p style="color:#666; font-size:14px;">Purpose: ${v.purpose}</p>
                <p style="color:#666; font-size:14px;">Date: ${v.date}</p>
                <div style="background:#000; color:#fff; padding:10px; margin-top:20px; font-size:20px; font-weight:bold;">
                    BADGE: ${v.badgeNumber}
                </div>
            </div>
        `);
        w?.print();
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-right-10 duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={24}/> : <AlertTriangle size={24}/>}
                    <span className="font-bold">{toast.msg}</span>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Visitor Log</h2>
                <button onClick={() => { setForm({ name: '', cnic: '', purpose: '', checkInTime: '', badgeNumber: '' }); setErrors({}); setIsOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">
                    <UserPlus size={18}/> Add Visitor
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b">
                        <tr>
                            <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Visitor Name</th>
                            <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Identification</th>
                            <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Purpose / Host</th>
                            <th className="p-4 font-bold uppercase text-[10px] tracking-wider text-center">Badge</th>
                            <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visitors.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">No visitors logged today.</td></tr>}
                        {visitors.map(v => (
                            <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-800">{v.name}</td>
                                <td className="p-4 text-slate-500 font-mono text-xs">{v.cnic || 'N/A'}</td>
                                <td className="p-4 text-slate-600">{v.purpose}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-slate-800 text-white px-3 py-1 rounded font-mono font-bold text-xs">{v.badgeNumber}</span>
                                </td>
                                <td className="p-4">
                                    <button onClick={() => handlePrintBadge(v)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold text-xs transition-colors"><Printer size={14}/> Print Badge</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-xl mb-6 text-slate-800">Register Entry</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Visitor Name *</label>
                                <input className={`w-full border p-3 rounded-xl outline-none transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CNIC / ID Number</label>
                                <input className="w-full border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-mono" placeholder="Identification" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Purpose / Host *</label>
                                <input className={`w-full border p-3 rounded-xl outline-none transition-all ${errors.purpose ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="e.g. Finance Meeting with Mr. Ali" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Security Badge ID *</label>
                                <input className={`w-full border p-3 rounded-xl outline-none transition-all font-mono ${errors.badgeNumber ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="V-XXXX" value={form.badgeNumber} onChange={e => setForm({...form, badgeNumber: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-8">
                            <button onClick={() => setIsOpen(false)} className="flex-1 border border-slate-200 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSubmit} disabled={isSaving} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Check size={18}/>}
                                {isSaving ? 'Saving...' : 'Register'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
