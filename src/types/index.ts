export type WeekDay = 'السبت' | 'الأحد' | 'الاثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس';

export interface Student {
  id: string;
  name: string;
  parentPhone: string;
  studentPhone?: string;
  grade: string;
  groupName: string;
  dayOfWeek: WeekDay;
  notes?: string;
  createdAt: number;
  teacherId: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  parentPhone: string;
  grade: string;
  groupName: string;
  status: AttendanceStatus;
  time?: string;
  teacherId: string;
  notes?: string;
}

export type PaymentType = 'monthly' | 'notes' | 'exam' | 'other';

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  parentPhone?: string;
  grade?: string;
  groupName?: string;
  month: string;
  type: PaymentType;
  typeLabel: string;
  amount: number;
  status: 'paid' | 'unpaid';
  date: string; // YYYY-MM-DD
  notes?: string;
  teacherId: string;
}

export interface TeacherProfile {
  teacherName: string;
  subject: string;
  centerName: string;
  whatsappTemplate: string;
  pinCode?: string;
  callMeBotApiKey?: string;
  callMeBotPhone?: string;
}

// All days of the week except Friday as requested
export const DAYS_OF_WEEK: WeekDay[] = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
];

// Groups correspond to the days of the week except Friday
export const DEFAULT_GROUPS: string[] = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
];

export const DEFAULT_GRADES = [
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
];

export const MONTHS_LIST = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];
