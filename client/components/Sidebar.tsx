
import React from 'react';
import { 
  Users, LayoutDashboard, CalendarDays, DollarSign, Briefcase, FileText, 
  ScanFace, FileSignature, UserCheck, UserPlus, Lock, LogOut 
} from 'lucide-react';
import { UserRole } from '../types';
import { UserContext } from '../context/UserContext';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: { 
  activeTab: string; 
  setActiveTab: (t: string) => void;
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
}) => {
  const { user, logout } = React.useContext(UserContext);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.HR_ADMIN, UserRole.HOD, UserRole.DIRECTOR, UserRole.LINE_MANAGER, UserRole.AUDITOR] },
    { id: 'employee_portal', label: 'My Dashboard (ESS)', icon: UserCheck, roles: [UserRole.MANAGEMENT_STAFF, UserRole.LINE_MANAGER, UserRole.HOD, UserRole.HR_ADMIN, UserRole.AUDITOR] },
    { id: 'attendance_kiosk', label: 'Face Recognition', icon: ScanFace, roles: [UserRole.HR_ADMIN, UserRole.LINE_MANAGER] },
    { id: 'employees', label: 'Employees & Documents', icon: Users, roles: [UserRole.HR_ADMIN, UserRole.HOD] },
    { id: 'attendance', label: 'Attendance Reports', icon: CalendarDays, roles: [UserRole.HR_ADMIN, UserRole.LINE_MANAGER, UserRole.HOD] },
    { id: 'leaves', label: 'Leave Applications', icon: FileText, roles: [UserRole.HR_ADMIN, UserRole.HOD, UserRole.LINE_MANAGER] },
    { id: 'payroll', label: 'Payroll & Salary', icon: DollarSign, roles: [UserRole.HR_ADMIN, UserRole.AUDITOR, UserRole.DIRECTOR, UserRole.HOD] },
    { id: 'users', label: 'User Management', icon: Lock, roles: [UserRole.HR_ADMIN] },
    { id: 'positions', label: 'Positions & Salary', icon: Briefcase, roles: [UserRole.HR_ADMIN] },
    { id: 'letters', label: 'Letter Generator', icon: FileSignature, roles: [UserRole.HR_ADMIN] },
    { id: 'visitors', label: 'Visitor Log', icon: UserPlus, roles: [UserRole.HR_ADMIN] },
  ];

  const filteredMenu = menuItems.filter(item => {
      return item.roles.some(r => user?.roles.includes(r));
  });

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-700">
           <div className="flex items-center gap-2 mb-1">
             <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center font-bold text-lg">K</div>
             <span className="text-xl font-bold tracking-tight">KnitWorks</span>
           </div>
           <p className="text-[10px] text-slate-400 uppercase tracking-widest pl-10">HCM Suite 3.0</p>
        </div>
        
        <div className="p-4 bg-slate-800/50 mx-4 mt-4 rounded-lg flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs">
                 {user?.username.substring(0,2).toUpperCase()}
             </div>
             <div className="overflow-hidden">
                 <div className="text-sm font-bold truncate">{user?.displayName}</div>
                 <div className="text-[10px] text-slate-400 uppercase truncate" title={user?.roles.join(', ')}>
                     {user?.roles.join(', ').replace('_', ' ')}
                 </div>
             </div>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 mt-8">
              <LogOut size={18} />
              <span className="font-medium text-sm">Logout</span>
          </button>
        </nav>
      </div>
    </>
  );
};
