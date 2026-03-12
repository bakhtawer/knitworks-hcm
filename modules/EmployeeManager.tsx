import React, { useState, useRef, useEffect } from 'react';
import { 
  UserPlus, Eye, Edit, Camera, Upload, File, Download, Trash2, X, AlertCircle, Inbox, Check, AlertTriangle, CheckCircle2, Plus, DollarSign
} from 'lucide-react';
import { Employee, Position, User, UserRole, EmployeeType, ManagementLevel, Division, Department, ShiftType, EmployeeDocument, ProfileChangeRequest, EmploymentStatus } from '../types';
import { sendEmailNotification } from '../utils/helpers';
import { api } from '../utils/api';

export const EmployeeManager = ({ employees, setEmployees, setUsers, positions, profileRequests, setProfileRequests }: any) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'personal'|'job'|'leaves'|'allowances'|'loans'|'docs'>('personal');
    const [showRequests, setShowRequests] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    
    const [form, setForm] = useState<Partial<Employee>>({
        firstName: '', lastName: '', cnic: '', email: '', salaryType: 'Monthly', 
        division: Division.OPERATIONS, department: Department.KNITTING, shift: ShiftType.MORNING,
        employmentStatus: EmploymentStatus.PROBATION,
        leaveBalance: { cl: 10, al: 14, sl: 8, hd_count: 0, short_leaves: 12 },
        documents: [],
        customAllowances: []
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imgInputRef = useRef<HTMLInputElement>(null);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleEdit = (emp: Employee, mode: 'edit' | 'view') => {
        setForm({
            ...emp,
            documents: emp.documents || [],
            customAllowances: emp.customAllowances || []
        });
        setEditingId(emp.id);
        setViewMode(mode === 'view');
        setIsFormOpen(true);
        setActiveTab('personal');
        setErrors({});
    };

    const handleAdd = () => {
        setForm({
            firstName: '', lastName: '', cnic: '', email: '', salaryType: 'Monthly', 
            division: Division.OPERATIONS, department: Department.KNITTING, shift: ShiftType.MORNING,
            employmentStatus: EmploymentStatus.PROBATION,
            leaveBalance: { cl: 10, al: 14, sl: 8, hd_count: 0, short_leaves: 12 },
            documents: [],
            customAllowances: []
        });
        setEditingId(null);
        setViewMode(false);
        setIsFormOpen(true);
        setActiveTab('personal');
        setErrors({});
    };

    const validateCNIC = (val: string) => {
        // Only allow numbers and max 13 digits
        return val.replace(/\D/g, '').slice(0, 13);
    };

    const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = validateCNIC(e.target.value);
        setForm({ ...form, cnic: masked });
    };

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateForm = () => {
        const newErrors: Record<string, boolean> = {};
        if (!form.firstName?.trim()) newErrors.firstName = true;
        if (!form.lastName?.trim()) newErrors.lastName = true;
        if (!form.cnic || form.cnic.length !== 13) newErrors.cnic = true;
        if (!form.email || !isValidEmail(form.email)) newErrors.email = true;
        if (!form.positionId) newErrors.positionId = true;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (viewMode) { setIsFormOpen(false); return; }
        
        if (!validateForm()) {
            setToast({ msg: "Please fix the highlighed incomplete or invalid fields.", type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...form,
                documents: form.documents || []
            };

            if (editingId) {
                const updated = await api.put(`/employees/${editingId}`, payload);
                setEmployees((prev: Employee[]) => prev.map(e => e.id === editingId ? updated : e));
                setToast({ msg: "Employee record updated successfully!", type: 'success' });
            } else {
                const newEmpData = { 
                    ...payload, 
                    isActive: true, 
                    joinDate: form.joinDate || new Date().toISOString().split('T')[0],
                    medicalAllowance: form.medicalAllowance || 0,
                    providentFund: form.providentFund || 0,
                    mobileAllowance: form.mobileAllowance || 0,
                    foodAllowance: form.foodAllowance || 0
                };

                const savedEmp = await api.post('/employees', newEmpData);
                setEmployees((prev: Employee[]) => [savedEmp, ...prev]);

                const pos = positions.find((p: Position) => p.id === form.positionId);
                let role = UserRole.LINE_MANAGER;
                if (pos?.type === EmployeeType.MANAGEMENT) {
                    role = UserRole.MANAGEMENT_STAFF;
                    if (pos.level === ManagementLevel.HOD) role = UserRole.HOD;
                    if (pos.level === ManagementLevel.DIRECTOR) role = UserRole.DIRECTOR;
                }

                const newUserPayload = {
                    username: form.email?.split('@')[0] || `user_${savedEmp.id.split('_').pop()}`,
                    password: '123',
                    roles: [role],
                    displayName: `${form.firstName} ${form.lastName}`,
                    employeeId: savedEmp.id,
                    email: form.email || ''
                };

                const savedUser = await api.post('/users', newUserPayload);
                if (setUsers) setUsers((prev: User[]) => [...prev, savedUser]);
                
                setToast({ msg: `Record saved and system user '@${savedUser.username}' created!`, type: 'success' });
            }
            setTimeout(() => setIsFormOpen(false), 1500);
        } catch (error: any) {
            setToast({ msg: "Error: " + error.message, type: 'error' });
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
                <h2 className="text-2xl font-bold text-slate-800">Employee Directory</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowRequests(true)} className="bg-white border text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 relative">
                        <Inbox size={18}/> Requests
                        {profileRequests?.filter((r:any) => r.status === 'Pending').length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">{profileRequests.filter((r:any) => r.status === 'Pending').length}</span>}
                    </button>
                    <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-200">
                        <UserPlus size={18}/> Add Employee
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {employees.map((emp: Employee) => (
                    <div key={emp.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 group hover:border-blue-300 transition-all">
                         <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 overflow-hidden shrink-0">
                             {emp.profilePicture ? <img src={emp.profilePicture} alt="" className="w-full h-full object-cover"/> : `${emp.firstName?.[0] || '?'}${emp.lastName?.[0] || '?'}`}
                         </div>
                         <div className="flex-1 overflow-hidden">
                             <h4 className="font-bold flex items-center gap-2 truncate">{emp.firstName} {emp.lastName} 
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 truncate">{emp.id}</span>
                             </h4>
                             <p className="text-xs text-slate-500 truncate">{emp.department} • {emp.shift}</p>
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEdit(emp, 'view')} className="p-2 text-slate-400 hover:text-blue-600" title="View Profile"><Eye size={18}/></button>
                             <button onClick={() => handleEdit(emp, 'edit')} className="p-2 text-slate-400 hover:text-blue-600" title="Edit Record"><Edit size={18}/></button>
                         </div>
                    </div>
                ))}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                     <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">{viewMode ? 'Employee Profile' : editingId ? 'Edit Employee' : 'Onboard New Employee'}</h3>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8">
                             <div className="flex gap-2 mb-6 overflow-x-auto">
                                {['personal', 'job', 'leaves', 'allowances', 'loans', 'docs'].map(t => {
                                    const isDisabled = (t === 'leaves' || t === 'allowances' || t === 'loans') && form.employmentStatus === EmploymentStatus.PROBATION;
                                    return (
                                        <button 
                                            key={t} 
                                            onClick={() => !isDisabled && setActiveTab(t as any)} 
                                            disabled={isDisabled}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase shrink-0 transition-colors ${activeTab === t ? 'bg-blue-600 text-white' : isDisabled ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            title={isDisabled ? 'Only available for Permanent employees' : ''}
                                        >
                                            {t === 'docs' ? 'Documents' : t}
                                        </button>
                                    );
                                })}
                             </div>
                             
                             {activeTab === 'personal' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                                     <div className="md:col-span-1 flex flex-col items-center gap-4">
                                         <div onClick={() => !viewMode && imgInputRef.current?.click()} className={`w-40 h-40 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed ${!viewMode ? 'border-slate-300 cursor-pointer hover:border-blue-500' : 'border-transparent'}`}>
                                             {form.profilePicture ? <img src={form.profilePicture} className="w-full h-full object-cover"/> : <Camera className="text-slate-400" size={32}/>}
                                         </div>
                                         <input type="file" ref={imgInputRef} className="hidden" accept="image/*" onChange={(e) => {
                                             if (e.target.files && e.target.files[0]) {
                                                 setForm({...form, profilePicture: URL.createObjectURL(e.target.files[0])});
                                             }
                                         }} />
                                         {!viewMode && <p className="text-xs text-slate-400">Click to upload photo</p>}
                                     </div>
                                     <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                         <div>
                                            <input className={`w-full border p-3 rounded outline-none transition-all ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="First Name *" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} disabled={viewMode} />
                                            {errors.firstName && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">Required</p>}
                                         </div>
                                         <div>
                                            <input className={`w-full border p-3 rounded outline-none transition-all ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="Last Name *" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} disabled={viewMode} />
                                            {errors.lastName && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">Required</p>}
                                         </div>
                                         <input className="border p-3 rounded border-slate-200 outline-none" placeholder="Father Name" value={form.fatherName} onChange={e => setForm({...form, fatherName: e.target.value})} disabled={viewMode} />
                                         <div>
                                            <input className={`w-full border p-3 rounded outline-none transition-all font-mono ${errors.cnic ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="CNIC (13 Digits) *" value={form.cnic} onChange={handleCnicChange} disabled={viewMode} maxLength={13} />
                                            <p className={`text-[10px] mt-1 font-bold uppercase ${errors.cnic ? 'text-red-500' : 'text-slate-400'}`}>
                                                {form.cnic?.length || 0} / 13 Digits
                                            </p>
                                         </div>
                                         <input className="border p-3 rounded border-slate-200 outline-none" type="date" placeholder="Date of Birth" value={form.dob ? new Date(form.dob).toISOString().split('T')[0] : ''} onChange={e => setForm({...form, dob: e.target.value})} disabled={viewMode} />
                                         <select className="border p-3 rounded border-slate-200 outline-none" value={form.gender} onChange={e => setForm({...form, gender: e.target.value as any})} disabled={viewMode}>
                                             <option value="Male">Male</option>
                                             <option value="Female">Female</option>
                                         </select>
                                         <div>
                                            <input className={`w-full border p-3 rounded outline-none transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="Email Address *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={viewMode} />
                                            {errors.email && <p className="text-[10px] text-red-500 mt-1 font-bold uppercase">Valid Email Required</p>}
                                         </div>
                                         <input className="border p-3 rounded border-slate-200 outline-none" type="number" placeholder="Dependents" value={form.dependents} onChange={e => setForm({...form, dependents: parseInt(e.target.value)})} disabled={viewMode} />
                                     </div>
                                </div>
                             )}

                             {activeTab === 'job' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                                         <select className="w-full border p-3 rounded border-slate-200 outline-none mt-1" value={form.department} onChange={e => setForm({...form, department: e.target.value as any})} disabled={viewMode}>
                                             {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <label className={`text-xs font-bold uppercase ${errors.positionId ? 'text-red-500' : 'text-slate-500'}`}>Position *</label>
                                         <select className={`w-full border p-3 rounded outline-none mt-1 transition-all ${errors.positionId ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} value={form.positionId} onChange={e => setForm({...form, positionId: e.target.value})} disabled={viewMode}>
                                             <option value="">Select Position</option>
                                             {positions.map((p: Position) => <option key={p.id} value={p.id}>{p.title} ({p.type})</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase">Shift</label>
                                         <select className="w-full border p-3 rounded border-slate-200 outline-none mt-1" value={form.shift} onChange={e => setForm({...form, shift: e.target.value as any})} disabled={viewMode}>
                                             {Object.values(ShiftType).map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase">Join Date</label>
                                         <input type="date" className="w-full border p-3 rounded border-slate-200 outline-none mt-1" value={form.joinDate ? new Date(form.joinDate).toISOString().split('T')[0] : ''} onChange={e => setForm({...form, joinDate: e.target.value})} disabled={viewMode} />
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase">Employment Status</label>
                                         <select className="w-full border p-3 rounded border-slate-200 outline-none mt-1" value={form.employmentStatus} onChange={e => setForm({...form, employmentStatus: e.target.value as any})} disabled={viewMode}>
                                             {Object.values(EmploymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                     </div>
                                </div>
                             )}

                             {activeTab === 'leaves' && (
                                <div className="animate-in fade-in duration-300">
                                    <div className="bg-amber-50 p-4 rounded-xl mb-6 text-sm text-amber-800 flex items-center gap-2 border border-amber-100">
                                        <AlertCircle size={18}/> 
                                        <span>Manual overrides will strictly replace the employee's calculated leave balance.</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {[
                                            { key: 'cl', label: 'Casual Leave (CL)' },
                                            { key: 'al', label: 'Annual Leave (AL)' },
                                            { key: 'sl', label: 'Sick Leave (SL)' },
                                            { key: 'short_leaves', label: 'Short Leaves' }
                                        ].map(field => (
                                            <div key={field.key} className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-center">
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">{field.label}</label>
                                                <input disabled={viewMode} type="number" className="w-full text-center font-bold text-2xl bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:border-blue-500 outline-none" 
                                                    value={(form.leaveBalance as any)?.[field.key] || 0} 
                                                    onChange={e => setForm({...form, leaveBalance: {...form.leaveBalance!, [field.key]: parseInt(e.target.value) || 0}})} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}

                             {activeTab === 'allowances' && (
                                <div className="animate-in fade-in duration-300 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-slate-700">Custom Monthly Allowances</h3>
                                        {!viewMode && (
                                            <button 
                                                onClick={() => setForm({ ...form, customAllowances: [...(form.customAllowances || []), { name: '', amount: 0 }] })}
                                                className="text-blue-600 text-sm font-bold hover:underline"
                                            >
                                                + Add Allowance
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-3">
                                         {(form.customAllowances || []).map((allowance, idx) => (
                                            <div key={idx} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Allowance Name</label>
                                                    <input 
                                                        disabled={viewMode}
                                                        className="w-full border-b bg-transparent py-1 outline-none focus:border-blue-500 font-medium"
                                                        placeholder="e.g. Fuel, Special"
                                                        value={allowance.name}
                                                        onChange={e => {
                                                            const updated = [...(form.customAllowances || [])];
                                                            updated[idx].name = e.target.value;
                                                            setForm({ ...form, customAllowances: updated });
                                                        }}
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Amount</label>
                                                    <input 
                                                        disabled={viewMode}
                                                        type="number"
                                                        className="w-full border-b bg-transparent py-1 outline-none focus:border-blue-500 font-mono font-bold"
                                                        value={allowance.amount}
                                                        onChange={e => {
                                                            const updated = [...(form.customAllowances || [])];
                                                            updated[idx].amount = parseFloat(e.target.value) || 0;
                                                            setForm({ ...form, customAllowances: updated });
                                                        }}
                                                    />
                                                </div>
                                                <div className="w-20">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tax %</label>
                                                    <input 
                                                        disabled={viewMode}
                                                        type="number"
                                                        className="w-full border-b bg-transparent py-1 outline-none focus:border-blue-500 font-mono font-bold"
                                                        value={allowance.taxPercentage || 0}
                                                        onChange={e => {
                                                            const updated = [...(form.customAllowances || [])];
                                                            updated[idx].taxPercentage = parseFloat(e.target.value) || 0;
                                                            setForm({ ...form, customAllowances: updated });
                                                        }}
                                                    />
                                                </div>
                                                {!viewMode && (
                                                    <button 
                                                        onClick={() => setForm({ ...form, customAllowances: (form.customAllowances || []).filter((_, i) => i !== idx) })}
                                                        className="mt-4 text-red-400 hover:text-red-600"
                                                    >
                                                        <Trash2 size={18}/>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {(!form.customAllowances || form.customAllowances.length === 0) && (
                                            <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed">
                                                No custom allowances defined for this employee.
                                            </div>
                                        )}
                                    </div>
                                </div>
                             )}

                             {activeTab === 'loans' && (
                                <div className="animate-in fade-in duration-300 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-slate-800">Employee Loans</h3>
                                        {!viewMode && (
                                            <button 
                                                onClick={() => {
                                                    const amount = Number(prompt('Enter Loan Amount:'));
                                                    const reason = prompt('Enter Reason:');
                                                    const deduction = Number(prompt('Enter Monthly Deduction:'));
                                                    if (amount && reason && deduction) {
                                                        setToast({ msg: 'Loan added successfully (Mock)', type: 'success' });
                                                    }
                                                }}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                                            >
                                                <Plus size={16} /> Add Loan
                                            </button>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <p className="text-slate-500 text-sm italic">Loan management for this employee. Approved loans will appear in payroll deductions.</p>
                                    </div>
                                    <div className="text-center py-12 text-slate-400">
                                        <p>No active loans found for this employee.</p>
                                    </div>
                                </div>
                             )}

                             {activeTab === 'docs' && (
                                 <div className="animate-in fade-in duration-300">
                                     <div className="flex justify-between items-center mb-4">
                                         <h3 className="font-bold text-slate-700">Uploaded Documents</h3>
                                         {!viewMode && (
                                             <div className="relative">
                                                 <input type="file" multiple ref={fileInputRef} className="hidden" onChange={(e) => {
                                                     if (e.target.files) {
                                                         // Fix: Explicitly type the file object to resolve 'unknown' type errors
                                                         const newDocs = Array.from(e.target.files).map((f: File) => ({
                                                             id: `doc_${Date.now()}_${Math.random()}`,
                                                             name: f.name,
                                                             type: f.type,
                                                             url: URL.createObjectURL(f),
                                                             uploadDate: new Date().toISOString().split('T')[0]
                                                         }));
                                                         setForm({...form, documents: [...(form.documents || []), ...newDocs]});
                                                     }
                                                 }} />
                                                 <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-700 transition-colors">
                                                     <Upload size={16}/> Upload Docs
                                                 </button>
                                             </div>
                                         )}
                                     </div>
                                     <div className="space-y-2">
                                         {(!form.documents || form.documents.length === 0) && <p className="text-slate-400 italic text-center py-8">No documents attached.</p>}
                                         {form.documents?.map((doc, idx) => (
                                             <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-white transition-colors">
                                                 <div className="flex items-center gap-3">
                                                     <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><File size={20}/></div>
                                                     <div>
                                                         <div className="text-sm font-bold text-slate-800">{doc.name}</div>
                                                         <div className="text-[10px] text-slate-500 uppercase">{doc.uploadDate}</div>
                                                     </div>
                                                 </div>
                                                 <div className="flex gap-2">
                                                     <a href={doc.url} download className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Download size={18}/></a>
                                                     {!viewMode && <button onClick={() => setForm({...form, documents: form.documents?.filter((_, i) => i !== idx)})} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>}
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                             {!viewMode && (
                                <button onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2">
                                    {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Check size={20}/>}
                                    {isSaving ? 'Processing...' : 'Save & Confirm'}
                                </button>
                             )}
                             <button onClick={() => setIsFormOpen(false)} className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                        </div>
                     </div>
                </div>
            )}
        </div>
    )
}