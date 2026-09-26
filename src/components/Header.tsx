import React from 'react';
import type { TeacherProfile, Student, PaymentRecord, AttendanceRecord } from '../types';
import { getCurrentArabicDay, formatArabicDate, getTodayDateString } from '../utils/helpers';
import { 
  GraduationCap, 
  Settings, 
  LogOut, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Banknote,
  LayoutGrid,
  Calendar,
  CloudCheck
} from 'lucide-react';

interface HeaderProps {
  profile: TeacherProfile;
  students: Student[];
  payments: PaymentRecord[];
  attendanceRecords: AttendanceRecord[];
  onOpenSettings: () => void;
  onSignOut: () => void;
  isGridView: boolean;
  onToggleView: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  students,
  payments,
  attendanceRecords,
  onOpenSettings,
  onSignOut,
  isGridView,
  onToggleView
}) => {
  const todayStr = getTodayDateString();
  const currentDay = getCurrentArabicDay();
  
  // Calculate summary stats
  const totalStudents = students.length;
  const todayRecords = attendanceRecords.filter(r => r.date === todayStr);
  const todayPresent = todayRecords.filter(r => r.status === 'present').length;
  const todayAbsent = todayRecords.filter(r => r.status === 'absent').length;

  const unpaidCount = payments.filter(p => p.status === 'unpaid').length;
  const unpaidTotal = payments
    .filter(p => p.status === 'unpaid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <header className="mb-6 space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-sm flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              لوحة تحكم الأكاديمية - نظام المدرسين الاحترافي
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">{profile.centerName || 'نظام إدارة الحصص والمجموعات'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                قاعدة بيانات متصلة سحابياً
              </span>
            </div>
          </div>
        </div>

        {/* Admin info & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="admin-info flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs md:text-sm text-slate-700 font-semibold shadow-2xs">
            <span>مرحباً بك، {profile.teacherName} 👨‍🏫</span>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition shadow-2xs cursor-pointer"
            title="إعدادات الملف وقالب الواتساب"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="p-2 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-xl text-slate-500 transition shadow-2xs cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">إجمالي الطلاب</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{totalStudents}</div>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">حضور اليوم ({currentDay})</div>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{todayPresent}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">غياب اليوم</div>
            <div className="text-xl font-black text-rose-600 mt-0.5">{todayAbsent}</div>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">اشتراكات معلقة</div>
            <div className="text-base font-black text-amber-600 mt-0.5">
              {unpaidTotal} <span className="text-xs font-normal text-slate-500">ج.م ({unpaidCount})</span>
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Banknote className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};
