
export enum Division {
  OPERATIONS = 'Operations',
  MARKETING = 'Marketing'
}

export enum Department {
  // Operations
  KNITTING = 'Knitting',
  PPC = 'PPC',
  CPW = 'CPW',
  FINISHING = 'Finishing',
  SEAMING = 'Seaming',
  WIP = 'WIP',
  QUALITY = 'Quality',
  DYEING = 'Dyeing',
  OPERATIONS_ADMIN = 'Operations Admin',
  
  // Marketing / Admin
  IT = 'IT',
  MERCHANDISING = 'Merchandising',
  MARKETING = 'Marketing',
  EXPORT = 'Export',
  FINANCE = 'Finance',
  HR = 'HR',
  ADMIN = 'Admin',
  AUDIT = 'Audit',
  COMPLIANCE = 'Compliance'
}

export enum EmployeeType {
  LABOR = 'Labor',
  MANAGEMENT = 'Management'
}

export enum ManagementLevel {
  MTO = 'MTO', // Management Trainee Officer
  EXECUTIVE = 'Executive',
  SENIOR_EXECUTIVE = 'Senior Executive',
  OFFICER = 'Officer',
  AM = 'Assistant Manager',
  DM = 'Deputy Manager',
  MANAGER = 'Manager',
  SENIOR_MANAGER = 'Senior Manager',
  HOD = 'Head of Department',
  DIRECTOR = 'Director',
  CEO = 'CEO'
}

export enum ShiftType {
  MORNING = '07:00 AM - 03:00 PM (A)',
  EVENING = '03:00 PM - 11:00 PM (B)',
  NIGHT = '11:00 PM - 07:00 AM (C)'
}

export enum LetterType {
  APPOINTMENT = 'Appointment Letter',
  CONFIRMATION = 'Confirmation Letter',
  TERMINATION = 'Termination Letter',
  INCREMENT = 'Increment Letter',
  WARNING = 'Warning Letter',
  INQUIRY = 'Inquiry Letter',
  CHARGE_SHEET = 'Charge Sheet'
}

export enum UserRole {
  HR_ADMIN = 'HR_ADMIN', // Complete Access
  AUDITOR = 'AUDITOR', // Read Only Payroll & Reports
  LINE_MANAGER = 'LINE_MANAGER', // Can add leaves/applications for Labor
  MANAGEMENT_STAFF = 'MANAGEMENT_STAFF', // Check own salary/leaves/attendance
  HOD = 'HOD', // Approve leaves, view dept data
  DIRECTOR = 'DIRECTOR'
}

export interface User {
  id: string;
  username: string; // Login ID
  password?: string; // In real app, hashed
  roles: UserRole[]; // Changed from single role to array
  employeeId?: string; // Linked to an employee record
  displayName: string;
  email: string; // Added for notifications
}

export interface Position {
  id: string;
  title: string;
  baseSalary: number; // Official Salary (Bank)
  salaryCap?: number; // If salary exceeds this, rest is Cash
  taxPercentage: number;
  type: EmployeeType;
  level?: ManagementLevel;
  targetDailyOutput?: number;
  overtimeRate: number;
  customAllowances?: { name: string; amount: number }[]; // Dynamic allowances
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  url: string; // In real app, blob URL or S3 link
  uploadDate: string;
}

export interface Employee {
  id: string;
  // Basic Info
  firstName: string;
  lastName: string;
  cnic: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  maritalStatus: 'Single' | 'Married' | 'Divorced';
  fatherName: string;
  dependents: number;
  profilePicture?: string; // URL
  email: string;
  
  // Job Info
  positionId: string;
  joinDate: string;
  division: Division;
  department: Department;
  shift: ShiftType;
  isActive: boolean;
  salaryType?: 'Monthly' | 'Hourly';
  
  // Financial
  bankAccount?: string;
  
  // Contact
  emergencyContact?: string;
  
  // Documents
  documents: EmployeeDocument[];
  
  // Leave Balances (Managed by HR)
  leaveBalance: {
    cl: number; // Casual Leave
    al: number; // Annual Leave
    sl: number; // Sick Leave
    hd_count: number; // Half Days taken/allowed
    short_leaves: number; // Short Leaves allowed/taken
  };
  
  // Standard Allowances
  medicalAllowance: number;
  providentFund: number; // %
  mobileAllowance: number;
  foodAllowance: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'HalfDay';
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  hoursWorked: number;
  overtimeHours: number;
  isShortLeave: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'DeptApproved' | 'Approved' | 'Rejected'; // 2-step approval
  type: 'Sick' | 'Casual' | 'Annual' | 'ShortLeave';
  isPaid: boolean; 
  rejectionReason?: string;
}

export interface ProfileChangeRequest {
  id: string;
  employeeId: string;
  requestDate: string;
  details: string; // What needs changing
  status: 'Pending' | 'Resolved';
}

export interface ProductionRecord {
  id: string;
  employeeId: string;
  date: string;
  pairsProduced: number;
  efficiency: number; // percentage vs target
}

export interface LoanRequest {
  id: string;
  employeeId: string;
  amount: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  monthlyDeduction: number;
  remainingBalance: number;
  requestDate: string;
}

export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  position: string;
  division: Division;
  department: Department;
  
  // Income Breakdown
  baseSalary: number; // Official Bank
  cashSalary: number; // Excess Amount
  attendanceAllowance: number;
  mobileAllowance: number;
  foodAllowance: number;
  medicalAllowance: number;
  customAllowancesAmount: number; // Sum of dynamic position allowances
  
  // Attendance Stats
  attendanceDays: number; // Paid days
  lates: number;
  absents: number;
  halfDays: number;
  
  // Variable Pay
  overtimeHours: number;
  overtimePay: number;
  productionIncentive: number;
  
  // Deductions
  loanDeduction: number;
  taxAmount: number;
  pfDeduction: number;
  lateDeductionAmount: number; // The "4th late = 1 day" deduction
  
  // Totals
  grossSalary: number;
  netSalary: number;
  netBankPayable: number;
  netCashPayable: number;
  
  month: string; // YYYY-MM
  status: 'Draft' | 'Approved' | 'Paid';
}

export interface Visitor {
  id: string;
  name: string;
  cnic: string;
  purpose: string;
  hostEmployeeId: string;
  checkInTime: string;
  checkOutTime?: string;
  date: string;
  badgeNumber: string;
}
