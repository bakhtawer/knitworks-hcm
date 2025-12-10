
import { Employee, EmployeeType, ManagementLevel, Position, AttendanceRecord, LeaveRequest, ShiftType, LoanRequest, ProductionRecord, Division, Department, LetterType, User, UserRole, Visitor } from './types';

// --- MOCK USERS FOR LOGIN ---
export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'hr_admin', password: '123', roles: [UserRole.HR_ADMIN], displayName: 'Sarah (HR Head)', email: 'sarah.hr@knitworks.com' },
  { id: 'u2', username: 'director', password: '123', roles: [UserRole.DIRECTOR], displayName: 'Mr. Director', email: 'director@knitworks.com' },
  { id: 'u3', username: 'auditor', password: '123', roles: [UserRole.AUDITOR], displayName: 'Mr. Accountant', email: 'audit@knitworks.com' },
  { id: 'u4', username: 'hod_ops', password: '123', roles: [UserRole.HOD], displayName: 'Mr. Operations (HOD)', employeeId: 'e_hod1', email: 'ops.hod@knitworks.com' },
  { id: 'u5', username: 'line_mgr', password: '123', roles: [UserRole.LINE_MANAGER], displayName: 'Ali (Supervisor)', employeeId: 'e_sup1', email: 'ali.sup@knitworks.com' },
  { id: 'u6', username: 'employee', password: '123', roles: [UserRole.MANAGEMENT_STAFF], displayName: 'John Doe', employeeId: 'e_exec1', email: 'john.doe@knitworks.com' },
  // Multi-role example
  { id: 'u7', username: 'super_emp', password: '123', roles: [UserRole.MANAGEMENT_STAFF, UserRole.AUDITOR], displayName: 'Super User (Emp+Audit)', employeeId: 'e_mgr', email: 'super@knitworks.com' },
];

export const POSITIONS: Position[] = [
  // --- OPERATIONS (LABOR) ---
  { id: 'p_knit_op', title: 'Knitting Operator', baseSalary: 32000, taxPercentage: 0, type: EmployeeType.LABOR, targetDailyOutput: 120, overtimeRate: 1.5 },
  { id: 'p_fixer', title: 'Fixer', baseSalary: 45000, taxPercentage: 0, type: EmployeeType.LABOR, targetDailyOutput: 0, overtimeRate: 1.5, customAllowances: [{name: 'Tool Allowance', amount: 2000}] },
  { id: 'p_lead_fixer', title: 'Lead Fixer', baseSalary: 60000, taxPercentage: 2.5, type: EmployeeType.MANAGEMENT, level: ManagementLevel.OFFICER, overtimeRate: 1.5 },
  { id: 'p_seam_op', title: 'Seaming Operator', baseSalary: 28000, taxPercentage: 0, type: EmployeeType.LABOR, targetDailyOutput: 150, overtimeRate: 1.5 },
  { id: 'p_packer', title: 'Packer', baseSalary: 25000, taxPercentage: 0, type: EmployeeType.LABOR, targetDailyOutput: 300, overtimeRate: 1.5 },
  { id: 'p_helper', title: 'Helper', baseSalary: 22000, taxPercentage: 0, type: EmployeeType.LABOR, targetDailyOutput: 0, overtimeRate: 1.5 },
  { id: 'p_loader', title: 'Loader', baseSalary: 22000, taxPercentage: 0, type: EmployeeType.LABOR, targetDailyOutput: 0, overtimeRate: 1.5 },
  { id: 'p_qa', title: 'Quality Auditor', baseSalary: 35000, taxPercentage: 0, type: EmployeeType.LABOR, targetDailyOutput: 400, overtimeRate: 1.5 },
  { id: 'p_dyer', title: 'Dyeing Operator', baseSalary: 30000, taxPercentage: 0, type: EmployeeType.LABOR, targetDailyOutput: 0, overtimeRate: 1.5, customAllowances: [{name: 'Heat Allowance', amount: 3000}] },
  { id: 'p_officer', title: 'Operations Officer', baseSalary: 45000, taxPercentage: 0, type: EmployeeType.MANAGEMENT, level: ManagementLevel.OFFICER, overtimeRate: 1.5 },
  
  // --- OPERATIONS (MANAGEMENT) ---
  { id: 'p_sup', title: 'Supervisor', baseSalary: 55000, taxPercentage: 2.5, type: EmployeeType.MANAGEMENT, level: ManagementLevel.OFFICER, overtimeRate: 1.5 },
  { id: 'p_incharge', title: 'Incharge', baseSalary: 70000, taxPercentage: 5, type: EmployeeType.MANAGEMENT, level: ManagementLevel.AM, overtimeRate: 1.5 },
  
  // --- MANAGEMENT STRUCTURE (MTO -> HOD) ---
  { id: 'p_mto', title: 'MTO', baseSalary: 40000, taxPercentage: 0, type: EmployeeType.MANAGEMENT, level: ManagementLevel.MTO, overtimeRate: 1.5 },
  { id: 'p_exec', title: 'Executive', baseSalary: 50000, taxPercentage: 1.0, type: EmployeeType.MANAGEMENT, level: ManagementLevel.EXECUTIVE, overtimeRate: 1.5 },
  { id: 'p_sr_exec', title: 'Senior Executive', baseSalary: 65000, taxPercentage: 2.5, type: EmployeeType.MANAGEMENT, level: ManagementLevel.SENIOR_EXECUTIVE, overtimeRate: 1.5 },
  { id: 'p_am', title: 'Assistant Manager', baseSalary: 90000, taxPercentage: 7.5, type: EmployeeType.MANAGEMENT, level: ManagementLevel.AM, overtimeRate: 1.0 },
  { id: 'p_dm', title: 'Deputy Manager', baseSalary: 110000, taxPercentage: 10.0, type: EmployeeType.MANAGEMENT, level: ManagementLevel.DM, overtimeRate: 1.0 },
  { id: 'p_mgr', title: 'Manager', baseSalary: 140000, salaryCap: 150000, taxPercentage: 12.5, type: EmployeeType.MANAGEMENT, level: ManagementLevel.MANAGER, overtimeRate: 1.0 },
  { id: 'p_sr_mgr', title: 'Senior Manager', baseSalary: 180000, salaryCap: 150000, taxPercentage: 15, type: EmployeeType.MANAGEMENT, level: ManagementLevel.SENIOR_MANAGER, overtimeRate: 0 },
  { id: 'p_hod', title: 'Head of Department', baseSalary: 250000, salaryCap: 150000, taxPercentage: 20, type: EmployeeType.MANAGEMENT, level: ManagementLevel.HOD, overtimeRate: 0 },
  
  // --- TOP MANAGEMENT ---
  { id: 'p_dir', title: 'Director', baseSalary: 400000, salaryCap: 300000, taxPercentage: 25, type: EmployeeType.MANAGEMENT, level: ManagementLevel.DIRECTOR, overtimeRate: 0 },
  { id: 'p_ceo', title: 'CEO', baseSalary: 800000, salaryCap: 300000, taxPercentage: 30, type: EmployeeType.MANAGEMENT, level: ManagementLevel.CEO, overtimeRate: 0 },
];

export const LETTER_TEMPLATES: Record<LetterType, string> = {
  [LetterType.APPOINTMENT]: `Date: {date}\n\nDear {name},\n\nWe are pleased to appoint you as {position} in the {department} department at KnitWorks Manufacturing. Your start date is {joinDate}.\n\nYour salary package includes:\n- Basic Salary: {salary}\n- Medical Allowance\n- PF Contribution\n\nWelcome to the team.\n\nSincerely,\nHR Department`,
  [LetterType.CONFIRMATION]: `Date: {date}\n\nDear {name},\n\nWe are pleased to confirm your employment as {position} effective from today. We appreciate your dedication during the probation period.\n\nSincerely,\nHR Department`,
  [LetterType.TERMINATION]: `Date: {date}\n\nDear {name},\n\nThis letter serves as formal notice of termination of your employment as {position}, effective immediately, due to policy violations.\n\nHR Department`,
  [LetterType.INCREMENT]: `Date: {date}\n\nDear {name},\n\nWe are pleased to inform you that your salary has been revised to {salary} effective from next month, in recognition of your performance.\n\nSincerely,\nManagement`,
  [LetterType.WARNING]: `Date: {date}\n\nDear {name},\n\nSubject: Warning Letter\n\nIt has come to our notice that you have been repeatedly late/absent. This is a formal warning to improve your attendance.\n\nHR Department`,
  [LetterType.INQUIRY]: `Date: {date}\n\nDear {name},\n\nYou are required to explain your absence/misconduct on {date} before the disciplinary committee within 24 hours.\n\nHR Department`,
  [LetterType.CHARGE_SHEET]: `Date: {date}\n\nDear {name},\n\nYou are hereby charged with the following misconduct: [Reason]. Please submit your written reply within 48 hours.\n\nHR Department`,
};

// Generate ~300 Mock Employees
const generateEmployees = (): Employee[] => {
  const employees: Employee[] = [];
  
  // 1. CEO & Directors
  employees.push({
    id: 'e_ceo', firstName: 'Ahsan', lastName: 'Malik', fatherName: 'Abdul Malik', cnic: '42101-0000000-1', email: 'ceo@knitworks.com',
    dob: '1970-01-01', gender: 'Male', maritalStatus: 'Married', dependents: 2,
    positionId: 'p_ceo', joinDate: '2015-01-01', division: Division.MARKETING, department: Department.ADMIN, shift: ShiftType.MORNING,
    isActive: true, salaryType: 'Monthly', medicalAllowance: 50000, providentFund: 10, mobileAllowance: 20000, foodAllowance: 15000,
    documents: [], leaveBalance: { cl: 10, al: 14, sl: 8, hd_count: 0, short_leaves: 12 }
  });

  const depts = Object.values(Department);
  let idCounter = 1;

  // Helper to add emp
  const addEmp = (posId: string, div: Division, dept: Department, count: number, shiftDist: number[]) => {
    for (let i = 0; i < count; i++) {
      const shift = Math.random() < shiftDist[0] ? ShiftType.MORNING : (Math.random() < shiftDist[1] ? ShiftType.EVENING : ShiftType.NIGHT);
      const pos = POSITIONS.find(p => p.id === posId);
      
      if (!pos) {
          console.warn(`Position ID ${posId} not found.`);
          continue;
      }

      employees.push({
        id: `e_${idCounter++}`,
        firstName: `User${idCounter}`,
        lastName: `Employee`,
        fatherName: `Father${idCounter}`,
        cnic: `42101-${1000000 + idCounter}-1`,
        email: `user${idCounter}@knitworks.com`,
        dob: '1990-01-01',
        gender: Math.random() > 0.8 ? 'Female' : 'Male',
        maritalStatus: Math.random() > 0.6 ? 'Married' : 'Single',
        dependents: Math.floor(Math.random() * 4),
        positionId: posId,
        joinDate: '2022-01-01',
        division: div,
        department: dept,
        shift: shift,
        isActive: true,
        salaryType: 'Monthly',
        medicalAllowance: pos.type === EmployeeType.MANAGEMENT ? 5000 : 2000,
        providentFund: 5,
        mobileAllowance: pos.type === EmployeeType.MANAGEMENT ? 3000 : 0,
        foodAllowance: 3000,
        documents: [],
        leaveBalance: { cl: 10, al: 14, sl: 8, hd_count: 0, short_leaves: 12 }
      });
    }
  };

  // Operations Division (Heavy Labor)
  addEmp('p_hod', Division.OPERATIONS, Department.OPERATIONS_ADMIN, 1, [1, 0]); // Dir Ops
  addEmp('p_mgr', Division.OPERATIONS, Department.KNITTING, 2, [1, 0]);
  addEmp('p_knit_op', Division.OPERATIONS, Department.KNITTING, 80, [0.33, 0.66]); // 3 shifts
  addEmp('p_fixer', Division.OPERATIONS, Department.KNITTING, 10, [0.33, 0.66]);
  addEmp('p_seam_op', Division.OPERATIONS, Department.SEAMING, 50, [1, 0]); // Mostly morning
  addEmp('p_qa', Division.OPERATIONS, Department.QUALITY, 20, [0.5, 0.8]);
  addEmp('p_helper', Division.OPERATIONS, Department.FINISHING, 30, [1, 0]);
  addEmp('p_dyer', Division.OPERATIONS, Department.DYEING, 15, [0.5, 0.8]);
  
  // Marketing / Admin Division
  addEmp('p_hod', Division.MARKETING, Department.MARKETING, 1, [1, 0]);
  addEmp('p_am', Division.MARKETING, Department.MARKETING, 4, [1, 0]);
  addEmp('p_mto', Division.MARKETING, Department.HR, 3, [1, 0]);
  addEmp('p_mgr', Division.MARKETING, Department.FINANCE, 1, [1, 0]);
  addEmp('p_exec', Division.MARKETING, Department.EXPORT, 2, [1, 0]); 
  addEmp('p_exec', Division.MARKETING, Department.IT, 3, [1, 0]); 

  return employees;
};

export const INITIAL_EMPLOYEES = generateEmployees();

export const INITIAL_LEAVES: LeaveRequest[] = [
  { id: 'l1', employeeId: 'e_ceo', startDate: '2023-10-05', endDate: '2023-10-06', reason: 'Business Trip', status: 'Approved', type: 'Annual', isPaid: true },
  { id: 'l2', employeeId: 'e_5', startDate: '2023-10-10', endDate: '2023-10-11', reason: 'Fever', status: 'Pending', type: 'Sick', isPaid: true },
  { id: 'l3', employeeId: 'e_12', startDate: '2023-10-12', endDate: '2023-10-14', reason: 'Family Event', status: 'DeptApproved', type: 'Casual', isPaid: true },
];

export const INITIAL_LOANS: LoanRequest[] = [];

// Enhanced Attendance Generator
export const generateMockAttendance = (employees: Employee[], monthOffset: number = 0): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  // Adjust month based on offset (0 = current, -1 = last month)
  const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  employees.forEach(emp => {
    // Determine shift start time
    let shiftStartH = 7; 
    if (emp.shift.includes('Evening')) shiftStartH = 15;
    if (emp.shift.includes('Night')) shiftStartH = 23;

    for (let day = 1; day <= Math.min(daysInMonth, 28); day++) {
       const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
       const dayOfWeek = new Date(dateStr).getDay();
       const isSunday = dayOfWeek === 0;
       
       if (!isSunday) {
         const random = Math.random();
         let status: AttendanceRecord['status'] = 'Present';
         let checkIn = `${String(shiftStartH).padStart(2,'0')}:00`;
         let checkOut = `${String((shiftStartH + 8) % 24).padStart(2,'0')}:00`;
         let hours = 8;
         let ot = 0;
         let isShortLeave = false;

         // Simulation Logic
         if (random > 0.90) { 
            status = 'Absent'; hours = 0; checkIn = ''; checkOut = '';
         } else if (random > 0.80) { 
            // Late Logic
            status = 'Late'; 
            const minutesLate = Math.floor(Math.random() * 150); // 0 to 150 mins late
            
            // Late CheckIn Time
            const lateH = shiftStartH + Math.floor(minutesLate / 60);
            const lateM = minutesLate % 60;
            checkIn = `${String(lateH).padStart(2,'0')}:${String(lateM).padStart(2,'0')}`;

            // Rule: After 2 hours (120 mins) = Half Day
            if (minutesLate > 120) {
              status = 'HalfDay';
              hours = 4;
            } else {
              hours = 8 - (minutesLate/60);
            }
         } else if (random > 0.75) {
            // Short Leave
             isShortLeave = true;
             hours = 6;
             checkOut = `${String((shiftStartH + 6) % 24).padStart(2,'0')}:00`;
         } else {
             // Overtime for Operations/Admin
             if ((emp.division === Division.OPERATIONS || emp.department === Department.ADMIN) && Math.random() > 0.7) {
                 ot = Math.floor(Math.random() * 3) + 1; 
                 checkOut = `${String((shiftStartH + 8 + ot) % 24).padStart(2,'0')}:00`;
             }
         }
         
         records.push({
           id: `att-${emp.id}-${dateStr}`,
           employeeId: emp.id,
           date: dateStr,
           status: status,
           checkIn,
           checkOut,
           hoursWorked: parseFloat(hours.toFixed(1)),
           overtimeHours: ot,
           isShortLeave
         });
       }
    }
  });
  return records;
};

export const INITIAL_VISITORS: Visitor[] = [
    { id: 'v1', name: 'John Supplier', cnic: '42101-1111111-1', purpose: 'Yarn Delivery Inspection', hostEmployeeId: 'e_mgr', checkInTime: '09:00', date: '2023-10-25', badgeNumber: 'V-101' },
    { id: 'v2', name: 'Mike Auditor', cnic: '42101-2222222-2', purpose: 'External Audit', hostEmployeeId: 'e_ceo', checkInTime: '10:30', date: '2023-10-25', badgeNumber: 'V-102' },
];

export const generateMockProduction = (employees: Employee[], positions: Position[]): ProductionRecord[] => {
    const records: ProductionRecord[] = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    employees.forEach(emp => {
        const pos = positions.find(p => p.id === emp.positionId);
        if (emp.division === Division.OPERATIONS && pos?.type === EmployeeType.LABOR && pos?.targetDailyOutput) {
            for (let day = 1; day <= 28; day++) {
                if (Math.random() > 0.1) { 
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const performanceFactor = 0.8 + Math.random() * 0.4;
                    const produced = Math.floor(pos.targetDailyOutput * performanceFactor);
                    
                    records.push({
                        id: `prod-${emp.id}-${day}`,
                        employeeId: emp.id,
                        date: dateStr,
                        pairsProduced: produced,
                        efficiency: Math.round((produced / pos.targetDailyOutput) * 100)
                    });
                }
            }
        }
    });
    return records;
};
