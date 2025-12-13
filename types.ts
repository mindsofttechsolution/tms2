export enum AppView {
  DASHBOARD = 'DASHBOARD',
  GPA = 'GPA',
  LEAVES = 'LEAVES',
  AI_ASSIST = 'AI_ASSIST',
  SCHEDULE = 'SCHEDULE',
  DOCUMENTS = 'DOCUMENTS',
  STUDENTS = 'STUDENTS',
  SETTINGS = 'SETTINGS'
}

export interface LeaveRecord {
  id: string;
  type: 'Casual' | 'Medical' | 'Duty' | 'Short';
  startDate: string;
  endDate: string;
  days: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  reason: string;
  approvedBy?: string;
}

export interface GradeOption {
  label: string;
  value: number; // Grade Point (e.g., A = 4.0)
}

export interface SubjectRow {
  id: string;
  name: string;
  credits: number;
  marks: number;
  gradePoint: number;
  gradeLetter: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  isError?: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
}

export interface TimeTableItem {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
  subject: string;
  grade: string;
  room: string;
  color: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'Appointment' | 'Certificates' | 'Payslips' | 'Other';
  date: string;
  imageUrl: string;
}

export interface Student {
  id: string;
  indexNo: string;
  name: string;
  parentName: string;
  contactNumber: string;
  gender: 'Male' | 'Female';
  photoUrl?: string;
}

export interface SchoolContact {
  id: string;
  role: string;
  name: string;
  phone: string;
}