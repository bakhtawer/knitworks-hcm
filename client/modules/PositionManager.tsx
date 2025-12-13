
import React, { useState } from 'react';
import { Plus, Edit, X } from 'lucide-react';
import { Position, EmployeeType } from '../types';
import { api } from '../utils/api';

export const PositionManager = ({ positions, setPositions }: { positions: Position[], setPositions: React.Dispatch<React.SetStateAction<Position[]>> }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Position>>({ title: '', baseSalary: 0, taxPercentage: 0, customAllowances: [] });
    const [isSaving, setIsSaving] = useState(false);
    
    // Allowances State
    const [allowanceInput, setAllowanceInput] = useState({ name: '', amount: 0 });

    const addAllowance = () => {
        if (!allowanceInput.name || allowanceInput.amount <= 0) return;
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
    };

    const handleAdd = () => {
        setForm({ title: '', baseSalary: 0, taxPercentage: 0, customAllowances: [] });
        setEditingId(null);
        setIsFormOpen(true);
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            if (editingId) {
                const updated = await api.put(`/positions/${editingId}`, form);
                setPositions(prev => prev.map(p => p.id === editingId ? updated : p));
            } else {
                const saved = await api.post('/positions', form);
                setPositions([...positions, saved]);
            }
            setIsFormOpen(false);
            setForm({ title: '', baseSalary: 0, taxPercentage: 0, customAllowances: [] });
        } catch (e: any) {
            alert("Failed to save position: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Position & Salary Management</h2>
                <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={18}/> Add Position
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {positions.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-xl border shadow-sm group hover:border-blue-300 transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg">{p.title}</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold">{p.type}</span>
                                <button onClick={() => handleEdit(p)} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                            <div className="flex justify-between"><span>Base Salary:</span> <span className="font-bold">{p.baseSalary.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>Tax:</span> <span className="font-bold">{p.taxPercentage}%</span></div>
                            {p.salaryCap && <div className="flex justify-between text-amber-600"><span>Cap:</span> <span className="font-bold">{p.salaryCap.toLocaleString()}</span></div>}
                        </div>
                        {p.customAllowances && p.customAllowances.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Custom Allowances</p>
                                {p.customAllowances.map((a, i) => (
                                    <div key={i} className="flex justify-between text-xs text-emerald-600 font-bold">
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
                    <div className="bg-white rounded-xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Position' : 'Add Position'}</h3>
                        <div className="space-y-4">
                            <input className="w-full border p-2 rounded" placeholder="Position Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Base Salary</label>
                                    <input type="number" className="w-full border p-2 rounded" value={form.baseSalary} onChange={e => setForm({...form, baseSalary: parseInt(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Tax %</label>
                                    <input type="number" className="w-full border p-2 rounded" value={form.taxPercentage} onChange={e => setForm({...form, taxPercentage: parseFloat(e.target.value)})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Type</label>
                                    <select className="w-full border p-2 rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                                        <option value={EmployeeType.LABOR}>Labor</option>
                                        <option value={EmployeeType.MANAGEMENT}>Management</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">OT Rate</label>
                                    <input type="number" className="w-full border p-2 rounded" placeholder="1.5" value={form.overtimeRate} onChange={e => setForm({...form, overtimeRate: parseFloat(e.target.value)})} />
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-3 rounded-lg border">
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Dynamic Allowances</label>
                                <div className="flex gap-2 mb-2">
                                    <input className="flex-1 border p-2 rounded text-sm" placeholder="Allowance Name" value={allowanceInput.name} onChange={e => setAllowanceInput({...allowanceInput, name: e.target.value})} />
                                    <input className="w-24 border p-2 rounded text-sm" type="number" placeholder="Amount" value={allowanceInput.amount} onChange={e => setAllowanceInput({...allowanceInput, amount: parseInt(e.target.value)})} />
                                    <button onClick={addAllowance} className="bg-emerald-600 text-white p-2 rounded"><Plus size={16}/></button>
                                </div>
                                <div className="space-y-1">
                                    {form.customAllowances?.map((a, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                            <span>{a.name}: <span className="font-bold">{a.amount}</span></span>
                                            <button onClick={() => removeAllowance(i)} className="text-red-500"><X size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded text-slate-600 font-bold">Cancel</button>
                            <button onClick={handleSubmit} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">{isSaving ? 'Saving...' : (editingId ? 'Update Position' : 'Save Position')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
