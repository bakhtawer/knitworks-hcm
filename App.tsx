
import React, { useState, useEffect } from 'react';
import { 
  Menu, Bell
} from 'lucide-react';
import { 
  Employee, Position, AttendanceRecord, LeaveRequest, 
  LoanRequest, Visitor, User, ProfileChangeRequest
} from './types';
import { 
  MOCK_USERS 
} from './constants';
import { api } from './utils/api';

// Context
import { UserContext } from './context/UserContext';

// Components & Modules
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './modules/Dashboard';
import { EmployeeSelfService } from './modules/EmployeeSelfService';
import { FaceRecKiosk } from './modules/FaceRecKiosk';
import { UserManager } from './modules/UserManager';
import { EmployeeManager } from './modules/EmployeeManager';
import { LeaveManager } from './modules/LeaveManager';
import { AttendanceReports } from './modules/AttendanceReports';
import { PayrollSystem } from './modules/PayrollSystem';
import { PositionManager } from './modules/PositionManager';
import { LetterGenerator } from './modules/LetterGenerator';
import { VisitorLog } from './modules/VisitorLog';


// --- Main App Wrapper ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State - Initialize empty, fetch from DB
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]); 
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loans, setLoans] = useState<LoanRequest[]>([]); 
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]); 
  const [users, setUsers] = useState<User[]>(MOCK_USERS); // Start with Mock for login, then fetch
  const [profileRequests, setProfileRequests] = useState<ProfileChangeRequest[]>([]);

  // Fetch Data on Login
  useEffect(() => {
      if (user) {
          const fetchData = async () => {
              try {
                  const [empData, posData, attData, userData, leaveData, visitorData, loanData, profileReqData] = await Promise.all([
                      api.get('/employees').catch(() => []),
                      api.get('/positions').catch(() => []),
                      api.get('/attendance').catch(() => []),
                      api.get('/users').catch(() => []),
                      api.get('/leaves').catch(() => []),
                      api.get('/visitors').catch(() => []),
                      api.get('/loans').catch(() => []),
                      api.get('/profile-requests').catch(() => []),
                  ]);

                  setEmployees(empData);
                  setPositions(posData.length ? posData : []); 
                  setAttendance(attData);
                  if (userData.length > 0) setUsers(userData);
                  setLeaves(leaveData);
                  setVisitors(visitorData);
                  setLoans(loanData);
                  setProfileRequests(profileReqData);

              } catch (error) {
                  console.error("Error fetching initial data", error);
              }
          };
          fetchData();
      }
  }, [user]);

  const handleAttendanceMark = async (empId: string, type: 'IN' | 'OUT') => {
      const timeNow = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      // Optimistic UI Update
      const todayStr = new Date().toISOString().split('T')[0];
      let updatedAttendance = [...attendance];
      const existingIndex = updatedAttendance.findIndex(r => r.employeeId === empId && r.date === todayStr);

      if (existingIndex >= 0) {
          updatedAttendance[existingIndex] = { 
              ...updatedAttendance[existingIndex], 
              checkIn: type === 'IN' ? timeNow : updatedAttendance[existingIndex].checkIn,
              checkOut: type === 'OUT' ? timeNow : updatedAttendance[existingIndex].checkOut
          };
      } else {
          updatedAttendance.push({
              id: `temp_${Date.now()}`,
              employeeId: empId,
              date: todayStr,
              status: 'Present',
              checkIn: timeNow,
              hoursWorked: 0,
              overtimeHours: 0,
              isShortLeave: false
          });
      }
      setAttendance(updatedAttendance);

      // API Call
      try {
          await api.post('/attendance', { employeeId: empId, type, time: timeNow });
          // Optionally re-fetch to sync IDs
          const freshData = await api.get('/attendance');
          setAttendance(freshData);
      } catch (e) {
          console.error("Failed to mark attendance", e);
          alert("Failed to save attendance to server");
      }
  };

  const renderContent = () => {
      switch(activeTab) {
          case 'dashboard': return <Dashboard employees={employees} attendance={attendance} visitors={visitors} />;
          case 'employee_portal': return <EmployeeSelfService employees={employees} leaves={leaves} setLeaves={setLeaves} profileRequests={profileRequests} setProfileRequests={setProfileRequests} loans={loans} setLoans={setLoans} />;
          case 'attendance_kiosk': return <FaceRecKiosk employees={employees} onMarkAttendance={handleAttendanceMark} />;
          case 'users': return <UserManager users={users} setUsers={setUsers} employees={employees} positions={positions} />;
          case 'employees': return <EmployeeManager employees={employees} setEmployees={setEmployees} setUsers={setUsers} positions={positions} profileRequests={profileRequests} setProfileRequests={setProfileRequests} />;
          case 'leaves': return <LeaveManager leaves={leaves} setLeaves={setLeaves} />;
          case 'attendance': return <AttendanceReports attendance={attendance} employees={employees} />;
          case 'payroll': return <PayrollSystem employees={employees} positions={positions} attendance={attendance} loans={loans} setLoans={setLoans} />;
          case 'positions': return <PositionManager positions={positions} setPositions={setPositions} />;
          case 'letters': return <LetterGenerator employees={employees} />;
          case 'visitors': return <VisitorLog visitors={visitors} setVisitors={setVisitors} />;
          default: return <div className="p-8 text-center text-slate-400">Module Under Construction</div>;
      }
  };

  if (!user) {
      return <LoginScreen onLogin={setUser} />;
  }

  return (
    <UserContext.Provider value={{ user, logout: () => setUser(null) }}>
        <div className="min-h-screen bg-slate-50 font-sans">
        <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
        />
        
        <main className="md:ml-64 transition-all duration-300">
            <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm print:hidden">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden"><Menu className="text-slate-600"/></button>
                <h1 className="text-lg font-bold text-slate-800 capitalize hidden md:block">{activeTab.replace('_', ' ')}</h1>
                <div className="flex items-center gap-4">
                     <Bell size={20} className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => alert("No new notifications")}/>
                     <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold" title={user.roles.join(', ')}>{user.roles[0]} +</span>
                </div>
            </header>
            <div className="p-6">
                {renderContent()}
            </div>
        </main>
        </div>
    </UserContext.Provider>
  );
}
