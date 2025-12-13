
import React, { useState } from 'react';
import { UserPlus, Database } from 'lucide-react';
import { User, UserRole, Employee, Position } from '../types';
import { sendEmailNotification } from '../utils/helpers';
import { api } from '../utils/api';
import { POSITIONS, INITIAL_EMPLOYEES, MOCK_USERS } from '../constants';

export const UserManager = ({ users, setUsers, employees, positions }: any) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [form, setForm] = useState<Partial<User>>({ username: '', password: '', displayName: '', roles: [], email: '' });

    const handleSubmit = async () => {
        if (!form.username || !form.password || !form.displayName || !form.email || form.roles?.length === 0) {
            alert("Please fill all required fields and select at least one role.");
            return;
        }

        try {
            const savedUser = await api.post('/users', { ...form });
            setUsers([...users, savedUser]);
            setIsFormOpen(false);
            setForm({ username: '', password: '', displayName: '', roles: [], email: '' });
            sendEmailNotification(savedUser.email, "Account Created", `Username: ${savedUser.username}\nPassword: ${savedUser.password}`);
        } catch (error: any) {
            alert("Failed to create user: " + error.message);
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
        if (!confirm("This will populate the database with initial Positions, Employees, and Users. Continue?")) return;
        
        setIsSeeding(true);
        try {
            // 1. Seed Positions
            console.log("Seeding Positions...");
            for (const pos of POSITIONS) {
                // Check if exists roughly or just try create (API should handle duplicates if unique constraints exist, otherwise it adds)
                // For simplicity, we just post. In real app, check existence first.
                 await api.post('/positions', pos).catch(e => console.warn(`Pos ${pos.title} skipped/failed`, e.message));
            }

            // 2. Seed Employees (First 10 to avoid timeout/spam)
            console.log("Seeding Employees...");
            const empsToSeed = INITIAL_EMPLOYEES.slice(0, 10); 
            for (const emp of empsToSeed) {
                 const payload = { ...emp };
                 // Clean up nested objects for API
                 if (payload.leaveBalance) payload.leaveBalance = payload.leaveBalance; 
                 await api.post('/employees', payload).catch(e => console.warn(`Emp ${emp.firstName} skipped`, e.message));
            }

            // 3. Seed Users
            console.log("Seeding Users...");
            for (const u of MOCK_USERS) {
                 await api.post('/users', u).catch(e => console.warn(`User ${u.username} skipped`, e.message));
            }

            alert("Database Seeded! Please refresh the page to see data.");
            window.location.reload();

        } catch (e: any) {
            alert("Seeding failed: " + e.message);
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                <div className="flex gap-2">
                    <button onClick={handleSeedDatabase} disabled={isSeeding} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700 disabled:opacity-50">
                        <Database size={18}/> {isSeeding ? 'Seeding...' : 'Seed DB with Demo Data'}
                    </button>
                    <button onClick={() => setIsFormOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <UserPlus size={18}/> Add User
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u: User) => (
                    <div key={u.id} className="bg-white p-5 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                {u.username.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold">{u.displayName}</h4>
                                <p className="text-xs text-slate-500">@{u.username}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {u.roles?.map(r => (
                                <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">{r.replace('_', ' ')}</span>
                            ))}
                        </div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                ))}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-bold mb-4">Create System User</h3>
                        <div className="space-y-4">
                            <input className="w-full border p-2 rounded" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                            <input className="w-full border p-2 rounded" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                            <input className="w-full border p-2 rounded" placeholder="Display Name" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} />
                            <input className="w-full border p-2 rounded" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Assign Roles (Multi-select)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.values(UserRole).map(role => (
                                        <label key={role} className="flex items-center gap-2 text-sm p-2 border rounded cursor-pointer hover:bg-slate-50">
                                            <input type="checkbox" checked={form.roles?.includes(role)} onChange={() => toggleRole(role)} />
                                            {role.replace('_', ' ')}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 border rounded text-slate-600 font-bold">Cancel</button>
                            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Create User</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
