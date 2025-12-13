
import React, { useState, useRef } from 'react';
import { 
  UserPlus, Eye, Edit, Camera, Upload, File, Download, Trash2, X, AlertCircle
} from 'lucide-react';
import { Employee, Position, User, UserRole, EmployeeType, ManagementLevel, Division, Department, ShiftType, EmployeeDocument } from '../types';
import { sendEmailNotification } from '../utils/helpers';

export const EmployeeManager = ({ employees, setEmployees, setUsers, positions }: any) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'personal'|'job'|'leaves'|'docs'>('personal');
    
    const [form, setForm] = useState<Partial<Employee>>({
        firstName: '', lastName: '', cnic: '', email: '', salaryType: 'Monthly', 
        division: Division.OPERATIONS, department: Department.KNITTING, shift: ShiftType.MORNING,
        leaveBalance: { cl: 10, al: 14, sl: 8, hd_count: 0, short_leaves: 12 },
        documents: []
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imgInputRef = useRef<HTMLInputElement>(null);

    const handleEdit = (emp: Employee, mode: 'edit' | 'view') => {
        setForm(emp);
        setEditingId(emp.id);
        setViewMode(mode === 'view');
        setIsFormOpen(true);
        setActiveTab('personal');
    };

    const handleAdd = () => {
        setForm({
            firstName: '', lastName: '', cnic: '', email: '', salaryType: 'Monthly', 
            division: Division.OPERATIONS, department: Department.KNITTING, shift: ShiftType.MORNING,
            leaveBalance: { cl: 10, al: 14, sl: 8, hd_count: 0, short_leaves: 12 },
            documents: []
        });
        setEditingId(null);
        setViewMode(false);
        setIsFormOpen(true);
        setActiveTab('personal');
    };

    const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setForm({ ...form, profilePicture: url });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newDocs: EmployeeDocument[] = Array.from(e.target.files).map((file: File) => ({
                id: `doc_${Date.now()}_${Math.random()}`,
                name: file.name,
                type: file.type,
                url: URL.createObjectURL(file), // Simulation
                uploadDate: new Date().toISOString().split('T')[0]
            }));
            setForm(prev => ({ ...prev, documents: [...(prev.documents || []), ...newDocs] }));
        }
    };

    const handleSubmit = () => {
        if (viewMode) { setIsFormOpen(false); return; }

        if (editingId) {
            const updated = employees.map((e: Employee) => e.id === editingId ? { ...e, ...form } : e);
            setEmployees(updated);
            alert("Employee Updated Successfully");
        } else {
            const id = `e_${Date.now()}`;
            const finalEmp = { ...form, id, isActive: true, joinDate: new Date().toISOString().split('T')[0] } as Employee;
            setEmployees([...employees, finalEmp]);

            // Auto Generate User
            const pos = positions.find((p: Position) => p.id === form.positionId);
            let role = UserRole.LINE_MANAGER;
            if (pos?.type === EmployeeType.MANAGEMENT) {
                role = UserRole.MANAGEMENT_STAFF;
                if (pos.level === ManagementLevel.HOD) role = UserRole.HOD;
                if (pos.level === ManagementLevel.DIRECTOR) role = UserRole.DIRECTOR;
            }

            const newUser: User = {
                id: `u_${Date.now()}`,
                username: form.email?.split('@')[0] || `user_${id}`,
                password: '123',
                roles: [role],
                displayName: `${form.firstName} ${form.lastName}`,
                employeeId: id,
                email: form.email || ''
            };

            setUsers((prev: User[]) => [...prev, newUser]);
            
            // Email Notification
            sendEmailNotification(
                newUser.email,
                "Welcome to KnitWorks HCM",
                `Your account has been created.\nUsername: ${newUser.username}\nPassword: 123`
            );
        }
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Employee Directory</h2>
                <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <UserPlus size={18}/> Add Employee
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {employees.map((emp: Employee) => (
                    <div key={emp.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 group hover:border-blue-300 transition-all">
                         <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 overflow-hidden shrink-0">
                             {emp.profilePicture ? <img src={emp.profilePicture} alt="" className="w-full h-full object-cover"/> : `${emp.firstName[0]}${emp.lastName[0]}`}
                         </div>
                         <div className="flex-1 overflow-hidden">
                             <h4 className="font-bold flex items-center gap-2 truncate">{emp.firstName} {emp.lastName} 
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{emp.id}</span>
                             </h4>
                             <p className="text-xs text-slate-500 truncate">{emp.department} • {emp.shift}</p>
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEdit(emp, 'view')} className="p-2 text-slate-400 hover:text-blue-600"><Eye size={18}/></button>
                             <button onClick={() => handleEdit(emp, 'edit')} className="p-2 text-slate-400 hover:text-blue-600"><Edit size={18}/></button>
                         </div>
                    </div>
                ))}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                     <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold">{viewMode ? 'Employee Profile' : editingId ? 'Edit Employee' : 'Onboard New Employee'}</h3>
                            <button onClick={() => setIsFormOpen(false)}><X/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8">
                             {/* Tabs Buttons */}
                             <div className="flex gap-2 mb-6 overflow-x-auto">
                                {['personal', 'job', 'leaves', 'docs'].map(t => (
                                    <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase shrink-0 ${activeTab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        {t.replace('docs', 'Documents')}
                                    </button>
                                ))}
                             </div>
                             
                             {/* PERSONAL INFO TAB */}
                             {activeTab === 'personal' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     <div className="md:col-span-1 flex flex-col items-center gap-4">
                                         <div onClick={() => !viewMode && imgInputRef.current?.click()} className={`w-40 h-40 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 ${!viewMode && 'cursor-pointer hover:border-blue-500'}`}>
                                             {form.profilePicture ? <img src={form.profilePicture} className="w-full h-full object-cover"/> : <Camera className="text-slate-400" size={32}/>}
                                         </div>
                                         <input type="file" ref={imgInputRef} className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
                                         {!viewMode && <p className="text-xs text-slate-400">Click to upload photo</p>}
                                     </div>
                                     <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                         <input className="border p-3 rounded" placeholder="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} disabled={viewMode} />
                                         <input className="border p-3 rounded" placeholder="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} disabled={viewMode} />
                                         <input className="border p-3 rounded" placeholder="Father Name" value={form.fatherName} onChange={e => setForm({...form, fatherName: e.target.value})} disabled={viewMode} />
                                         <input className="border p-3 rounded" placeholder="CNIC (e.g. 42101...)" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})} disabled={viewMode} />
                                         <input className="border p-3 rounded" type="date" placeholder="Date of Birth" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} disabled={viewMode} />
                                         <select className="border p-3 rounded" value={form.gender} onChange={e => setForm({...form, gender: e.target.value as any})} disabled={viewMode}>
                                             <option value="Male">Male</option>
                                             <option value="Female">Female</option>
                                         </select>
                                         <select className="border p-3 rounded" value={form.maritalStatus} onChange={e => setForm({...form, maritalStatus: e.target.value as any})} disabled={viewMode}>
                                             <option value="Single">Single</option>
                                             <option value="Married">Married</option>
                                         </select>
                                         <input className="border p-3 rounded" type="number" placeholder="Dependents" value={form.dependents} onChange={e => setForm({...form, dependents: parseInt(e.target.value)})} disabled={viewMode} />
                                         <input className="border p-3 rounded col-span-2" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={viewMode} />
                                     </div>
                                </div>
                             )}

                             {/* JOB DETAILS TAB */}
                             {activeTab === 'job' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                                         <select className="w-full border p-3 rounded mt-1" value={form.department} onChange={e => setForm({...form, department: e.target.value as any})} disabled={viewMode}>
                                             {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase">Position</label>
                                         <select className="w-full border p-3 rounded mt-1" value={form.positionId} onChange={e => setForm({...form, positionId: e.target.value})} disabled={viewMode}>
                                             <option value="">Select Position</option>
                                             {positions.map((p: Position) => <option key={p.id} value={p.id}>{p.title} ({p.type})</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase">Shift</label>
                                         <select className="w-full border p-3 rounded mt-1" value={form.shift} onChange={e => setForm({...form, shift: e.target.value as any})} disabled={viewMode}>
                                             {Object.values(ShiftType).map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-slate-500 uppercase">Salary Type</label>
                                         <select className="w-full border p-3 rounded mt-1" value={form.salaryType} onChange={e => setForm({...form, salaryType: e.target.value as any})} disabled={viewMode}>
                                             <option value="Monthly">Monthly</option>
                                             <option value="Hourly">Hourly</option>
                                         </select>
                                     </div>
                                </div>
                             )}

                             {/* LEAVES TAB */}
                             {activeTab === 'leaves' && (
                                <div>
                                    <div className="bg-amber-50 p-4 rounded-lg mb-6 text-sm text-amber-800 flex items-center gap-2">
                                        <AlertCircle size={16}/> Adjusting these values will strictly override the employee's current leave balance.
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {[
                                            { key: 'cl', label: 'Casual Leave (CL)' },
                                            { key: 'al', label: 'Annual Leave (AL)' },
                                            { key: 'sl', label: 'Sick Leave (SL)' },
                                            { key: 'short_leaves', label: 'Short Leaves' },
                                            { key: 'hd_count', label: 'Half Days Taken' }
                                        ].map(field => (
                                            <div key={field.key} className="p-4 border rounded-xl bg-slate-50 text-center">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{field.label}</label>
                                                <input disabled={viewMode} type="number" className="w-full text-center font-bold text-2xl bg-white border rounded p-2 text-slate-700" 
                                                    value={(form.leaveBalance as any)?.[field.key] || 0} 
                                                    onChange={e => setForm({...form, leaveBalance: {...form.leaveBalance!, [field.key]: parseInt(e.target.value)}})} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}

                             {/* DOCUMENTS TAB */}
                             {activeTab === 'docs' && (
                                 <div>
                                     <div className="flex justify-between items-center mb-4">
                                         <h3 className="font-bold text-slate-700">Uploaded Documents</h3>
                                         {!viewMode && (
                                             <div className="relative">
                                                 <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                                 <button onClick={() => fileInputRef.current?.click()} className="bg-slate-800 text-white px-3 py-2 rounded text-sm flex items-center gap-2">
                                                     <Upload size={16}/> Upload Documents
                                                 </button>
                                             </div>
                                         )}
                                     </div>
                                     <div className="space-y-2">
                                         {form.documents?.length === 0 && <p className="text-slate-400 italic">No documents uploaded yet.</p>}
                                         {form.documents?.map((doc, idx) => (
                                             <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                                 <div className="flex items-center gap-3">
                                                     <div className="p-2 bg-blue-100 text-blue-600 rounded"><File size={20}/></div>
                                                     <div>
                                                         <div className="text-sm font-bold text-slate-800">{doc.name}</div>
                                                         <div className="text-xs text-slate-500">{doc.uploadDate}</div>
                                                     </div>
                                                 </div>
                                                 <div className="flex gap-2">
                                                     <a href={doc.url} download className="p-2 text-slate-500 hover:text-blue-600"><Download size={18}/></a>
                                                     {!viewMode && <button onClick={() => setForm({...form, documents: form.documents?.filter((_, i) => i !== idx)})} className="p-2 text-slate-500 hover:text-red-600"><Trash2 size={18}/></button>}
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                             {!viewMode && <button onClick={handleSubmit} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Save Employee Record</button>}
                             <button onClick={() => setIsFormOpen(false)} className="bg-white border text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-50">Close</button>
                        </div>
                     </div>
                </div>
            )}
        </div>
    )
}
