
import React, { useState, useEffect } from 'react';
import { Plus, Edit, X, CheckCircle2, AlertTriangle, Check } from 'lucide-react';
import { Position, EmployeeType } from '../types';
import { api } from '../utils/api';

export const PositionManager = ({ positions, setPositions }: { positions: Position[], setPositions: React.Dispatch<React.SetStateAction<Position[]>> }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Position>>({ title: '', baseSalary: 0, taxPercentage: 0, customAllowances: [], overtimeRate: 1.5, type: EmployeeType.LABOR });
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    
    const [allowanceInput, setAllowanceInput] = useState({ name: '', amount: 0 });

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const validateForm = () => {
        const newErrors: Record<string, boolean> = {};
        if (!form.title?.trim()) newErrors.title = true;
        if ((form.baseSalary || 0) <= 0) newErrors.baseSalary = true;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addAllowance = () => {
        if (!allowanceInput.name || allowanceInput.amount <= 0) {
            setToast({ msg: "Allowance name and positive amount required.", type: 'error' });
            return;
        }
        setForm(prev => ({
            ...prev,
            customAllowances: [...(prev.customAllowances || []), { ...allowanceInput }]
        }));
        setAllowanceInput({ name: '', amount: 0 });
    };

    const removeAllowance = (index: number) => {
        setForm(prev => ({
            ...prev,
            customAllowances: prev.customAllowances?.filter((_, i) => i !== index)
        }));
    };

    const handleEdit = (pos: Position) => {
        setForm(pos);
        setEditingId(pos.id);
        setIsFormOpen(true);
        setErrors({});
    };

    const handleAdd = () => {
        setForm({ title: '', baseSalary: 0, taxPercentage: 0, customAllowances: [], overtimeRate: 1.5, type: EmployeeType.LABOR });
        setEditingId(null);
        setIsFormOpen(true);
        setErrors({});
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setToast({ msg: "Incomplete information. Check required fields.", type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            if (editingId) {
                const updated = await api.put(`/positions/${editingId}`, form);
                setPositions(prev => prev.map(p => p.id === editingId ? updated : p));
                setToast({ msg: "Position updated successfully!", type: 'success' });
            } else {
                const saved = await api.post('/positions', form);
                setPositions([...positions, saved]);
                setToast({ msg: "New position added!", type: 'success' });
            }
            setTimeout(() => setIsFormOpen(false), 800);
        } catch (e: any) {
            setToast({ msg: "Failed: " + e.message, type: 'error' });
        } finally {
            setIsSaving(false);
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

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Position & Salary Management</h2>
                <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-200">
                    <Plus size={18}/> Add Position
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positions.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg text-slate-800">{p.title}</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500 uppercase">{p.type}</span>
                                <button onClick={() => handleEdit(p)} className="p-1 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={16}/></button>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                            <div className="flex justify-between"><span>Base Salary:</span> <span className="font-bold text-slate-800">Rs. {p.baseSalary.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>Tax Rate:</span> <span className="font-bold text-slate-800">{p.taxPercentage}%</span></div>
                            {p.salaryCap && <div className="flex justify-between text-amber-600"><span>Cash Payout Cap:</span> <span className="font-bold">{p.salaryCap.toLocaleString()}</span></div>}
                        </div>
                        {p.customAllowances && p.customAllowances.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Dynamic Allowances</p>
                                {p.customAllowances.map((a, i) => (
                                    <div key={i} className="flex justify-between text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded mb-1">
                                        <span>+ {a.name}</span>
                                        <span>{a.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-6 text-slate-800">{editingId ? 'Update Position' : 'Create Position'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Position Title *</label>
                                <input className={`w-full border p-3 rounded-lg outline-none transition-all ${errors.title ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="e.g. Senior Knitting Operator" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base Salary *</label>
                                    <input type="number" className={`w-full border p-3 rounded-lg outline-none transition-all ${errors.baseSalary ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} value={form.baseSalary} onChange={e => setForm({...form, baseSalary: parseInt(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tax Percentage</label>
                                    <input type="number" className="w-full border border-slate-200 p-3 rounded-lg outline-none focus:border-blue-500" value={form.taxPercentage} onChange={e => setForm({...form, taxPercentage: parseFloat(e.target.value) || 0})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                    <select className="w-full border border-slate-200 p-3 rounded-lg outline-none focus:border-blue-500" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                                        <option value={EmployeeType.LABOR}>Labor</option>
                                        <option value={EmployeeType.MANAGEMENT}>Management Staff</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">OT Multiplier</label>
                                    <input type="number" className="w-full border border-slate-200 p-3 rounded-lg outline-none focus:border-blue-500" step="0.1" value={form.overtimeRate} onChange={e => setForm({...form, overtimeRate: parseFloat(e.target.value) || 0})} />
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <label className="block text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Dynamic Allowances</label>
                                <div className="flex gap-2 mb-3">
                                    <input className="flex-1 border border-slate-200 p-2 rounded-lg text-sm outline-none focus:border-blue-500" placeholder="Name" value={allowanceInput.name} onChange={e => setAllowanceInput({...allowanceInput, name: e.target.value})} />
                                    <input className="w-24 border border-slate-200 p-2 rounded-lg text-sm outline-none focus:border-blue-500" type="number" placeholder="Amt" value={allowanceInput.amount} onChange={e => setAllowanceInput({...allowanceInput, amount: parseInt(e.target.value) || 0})} />
                                    <button onClick={addAllowance} className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors"><Plus size={18}/></button>
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {form.customAllowances?.map((a, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-slate-100 shadow-sm animate-in slide-in-from-top-1">
                                            <span className="font-bold text-slate-700">{a.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-600">Rs. {a.amount.toLocaleString()}</span>
                                                <button onClick={() => removeAllowance(i)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-8">
                            <button onClick={() => setIsFormOpen(false)} className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={handleSubmit} disabled={isSaving} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all">
                                {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Check size={18}/>}
                                {isSaving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
