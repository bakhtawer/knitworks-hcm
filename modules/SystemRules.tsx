
import React, { useState, useEffect } from 'react';
import { Settings, Save, Info, AlertCircle, Clock, DollarSign, Percent, Calculator } from 'lucide-react';
import { SystemSettings } from '../types';
import { api } from '../utils/api';

export function SystemRules() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await api.get('/settings');
            if (data && data.length > 0) {
                setSettings(data[0]);
            }
        } catch (error) {
            console.error("Error fetching settings", error);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await api.put(`/settings/${settings.id}`, settings);
            setToast({ msg: 'Settings updated successfully', type: 'success' });
            setTimeout(() => setToast(null), 3000);
        } catch (error) {
            setToast({ msg: 'Failed to update settings', type: 'error' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    if (!settings) return <div className="p-8 text-center text-slate-400">Loading settings...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">System Rules & Calculations</h2>
                    <p className="text-slate-500">Define global policies for payroll, attendance, and deductions.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
                >
                    {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={18}/>}
                    Save Changes
                </button>
            </div>

            {toast && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {toast.type === 'success' ? <Calculator size={20}/> : <AlertCircle size={20}/>}
                    <span className="font-bold">{toast.msg}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Rules */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={20}/></div>
                        <h3 className="font-bold text-slate-800">Attendance & Lates</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Allowed Lates per Month</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 font-mono font-bold"
                                value={settings.allowedLates}
                                onChange={e => setSettings({...settings, allowedLates: parseInt(e.target.value) || 0})}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Number of late arrivals allowed before deduction starts.</p>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Late Deduction (Days)</label>
                            <input 
                                type="number" 
                                step="0.1"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 font-mono font-bold"
                                value={settings.lateDeductionDays}
                                onChange={e => setSettings({...settings, lateDeductionDays: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Days of salary deducted for every N lates (e.g., 1.0 day for every 4th late).</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Half-Day Deduction (Days)</label>
                            <input 
                                type="number" 
                                step="0.1"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 font-mono font-bold"
                                value={settings.halfDayDeduction}
                                onChange={e => setSettings({...settings, halfDayDeduction: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Salary deduction for a marked half-day.</p>
                        </div>
                    </div>
                </div>

                {/* Payroll & OT */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20}/></div>
                        <h3 className="font-bold text-slate-800">Payroll & Overtime</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Overtime Rate (Multiplier)</label>
                            <input 
                                type="number" 
                                step="0.1"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 font-mono font-bold"
                                value={settings.overtimeRate}
                                onChange={e => setSettings({...settings, overtimeRate: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Hourly rate multiplier for overtime (e.g., 1.5x, 2.0x).</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Attendance Bonus (Monthly)</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 font-mono font-bold"
                                value={settings.attendanceBonus}
                                onChange={e => setSettings({...settings, attendanceBonus: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Fixed bonus for 100% attendance.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Food Allowance (Labor/Day)</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 font-mono font-bold"
                                value={settings.foodAllowanceLabor}
                                onChange={e => setSettings({...settings, foodAllowanceLabor: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Daily food allowance for labor staff.</p>
                        </div>
                    </div>
                </div>

                {/* Loans & Tax */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Percent size={20}/></div>
                        <h3 className="font-bold text-slate-800">Loans & Taxation</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Loan Limit (% of Salary)</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 font-mono font-bold"
                                value={settings.loanLimitPercent}
                                onChange={e => setSettings({...settings, loanLimitPercent: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-[10px] text-slate-400 mt-1 italic">Maximum loan amount as percentage of monthly base salary.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tax Slab 1 (Annual)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 font-mono font-bold"
                                    value={settings.taxSlab1}
                                    onChange={e => setSettings({...settings, taxSlab1: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tax Rate 1 (%)</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 font-mono font-bold"
                                    value={settings.taxRate1}
                                    onChange={e => setSettings({...settings, taxRate1: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Income above Slab 1 will be taxed at Rate 1.</p>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-200 text-white space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg"><Info size={20}/></div>
                        <h3 className="font-bold">Policy Impact</h3>
                    </div>
                    <p className="text-sm text-blue-100 leading-relaxed">
                        Changes to these rules will immediately affect the next payroll generation. 
                        Ensure all stakeholders are informed before modifying core calculation multipliers.
                    </p>
                    <div className="pt-4 border-t border-white/20">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-70">
                            <span>Last Updated</span>
                            <span>{new Date(settings.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
