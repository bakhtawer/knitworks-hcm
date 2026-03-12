
import React, { useState, useEffect } from 'react';
import { UserPlus, Database, RefreshCw, AlertTriangle, CheckCircle2, Check } from 'lucide-react';
import { User, UserRole, Employee, Position } from '../types';
import { sendEmailNotification } from '../utils/helpers';
import { api } from '../utils/api';
import { POSITIONS, INITIAL_EMPLOYEES, MOCK_USERS } from '../constants';

export const UserManager = ({ users, setUsers, employees, positions }: any) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [form, setForm] = useState<Partial<User>>({ username: '', password: '', displayName: '', roles: [], email: '' });

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validateForm = () => {
        const newErrors: Record<string, boolean> = {};
        if (!form.username?.trim()) newErrors.username = true;
        if (!form.password || form.password.length < 3) newErrors.password = true;
        if (!form.displayName?.trim()) newErrors.displayName = true;
        if (!form.email || !isValidEmail(form.email)) newErrors.email = true;
        if (!form.roles || form.roles.length === 0) newErrors.roles = true;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setToast({ msg: "Incomplete details. Password must be 3+ chars and roles assigned.", type: 'error' });
            return;
        }

        try {
            const savedUser = await api.post('/users', { 
                ...form,
                passwordHash: form.password
            });
            setUsers([...users, savedUser]);
            setIsFormOpen(false);
            setForm({ username: '', password: '', displayName: '', roles: [], email: '' });
            setToast({ msg: `User '@${savedUser.username}' created successfully!`, type: 'success' });
            sendEmailNotification(savedUser.email, "Account Created", `Username: ${savedUser.username}\nPassword: ${form.password}`);
        } catch (error: any) {
            setToast({ msg: "Failed: " + error.message, type: 'error' });
        }
    };

    const toggleRole = (role: UserRole) => {
        const currentRoles = form.roles || [];
        if (currentRoles.includes(role)) {
            setForm({ ...form, roles: currentRoles.filter(r => r !== role) });
        } else {
            setForm({ ...form, roles: [...currentRoles, role] });
        }
    };

    const handleSeedDatabase = async () => {
        if (!confirm("Populate database with demo data? This skips existing records.")) return;
        
        setIsSeeding(true);
        let successCount = 0;
        try {
            for (const pos of POSITIONS) { try { await api.post('/positions', pos); successCount++; } catch (e) {} }
            const empsToSeed = INITIAL_EMPLOYEES.slice(0, 10); 
            for (const emp of empsToSeed) { try { await api.post('/employees', emp); successCount++; } catch (e) {} }
            for (const u of MOCK_USERS) { try { await api.post('/users', { ...u, passwordHash: u.password }); successCount++; } catch (e) {} }

            setToast({ msg: `Database seed finished. ${successCount} records processed.`, type: 'success' });
            setTimeout(() => window.location.reload(), 1500);
        } catch (e: any) {
            setToast({ msg: "Seed error: " + e.message, type: 'error' });
        } finally {
            setIsSeeding(false);
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
                <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                <div className="flex gap-2">
                    <button onClick={handleSeedDatabase} disabled={isSeeding} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700 disabled:opacity-50">
                        {isSeeding ? <RefreshCw size={18} className="animate-spin"/> : <Database size={18}/>}
                        {isSeeding ? 'Seeding...' : 'Seed DB'}
                    </button>
                    <button onClick={() => { setForm({ username: '', password: '', displayName: '', roles: [], email: '' }); setErrors({}); setIsFormOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-200">
                        <UserPlus size={18}/> Add User
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.length === 0 && <div className="col-span-full p-12 text-center text-slate-400 border-2 border-dashed rounded-xl font-medium">No users found. Use 'Seed DB' to start.</div>}
                {users.map((u: User) => (
                    <div key={u.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 uppercase">
                                {u.username.substring(0,2)}
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="font-bold text-slate-800 truncate">{u.displayName}</h4>
                                <p className="text-xs text-slate-500">@{u.username}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {u.roles?.map(r => (
                                <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold uppercase tracking-wider">{r.replace('_', ' ')}</span>
                            ))}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">{u.email}</div>
                    </div>
                ))}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-6 text-slate-800">New System Account</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username *</label>
                                    <input className={`w-full border p-3 rounded-lg outline-none transition-all ${errors.username ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="Login ID" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password *</label>
                                    <input className={`w-full border p-3 rounded-lg outline-none transition-all ${errors.password ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} type="password" placeholder="Min 3 chars" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Display Name *</label>
                                <input className={`w-full border p-3 rounded-lg outline-none transition-all ${errors.displayName ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="Full Name" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address *</label>
                                <input className={`w-full border p-3 rounded-lg outline-none transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="name@knitworks.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                            </div>
                            
                            <div>
                                <label className={`block text-[10px] font-bold uppercase mb-2 ${errors.roles ? 'text-red-500' : 'text-slate-400'}`}>System Permissions (Select At Least One) *</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                                    {Object.values(UserRole).map(role => (
                                        <label key={role} className={`flex items-center gap-2 text-xs p-2 border rounded-lg cursor-pointer transition-all ${form.roles?.includes(role) ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}`}>
                                            <input type="checkbox" className="hidden" checked={form.roles?.includes(role)} onChange={() => toggleRole(role)} />
                                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${form.roles?.includes(role) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                {form.roles?.includes(role) && <Check size={10} className="text-white"/>}
                                            </div>
                                            {role.replace('_', ' ')}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-8">
                            <button onClick={() => setIsFormOpen(false)} className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSubmit} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Create Account</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
