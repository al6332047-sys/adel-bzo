import React, { useState } from 'react';
import type { Student, AttendanceRecord, AttendanceStatus, PaymentRecord, WeekDay } from '../types';
import { DAYS_OF_WEEK, DEFAULT_GRADES } from '../types';
import { 
  ClipboardCheck, 
  Calendar, 
  Check, 
  Users, 
  Sparkles,
  AlertTriangle,
  XCircle,
  ArrowLeftRight,
  Banknote,
  Search
} from 'lucide-react';

interface DailyAttendanceCardProps {
  students: Student[];
  payments: PaymentRecord[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  teacherId?: string;
  onDateChange: (date: string) => void;
  onSaveSingleAttendance: (student: Student, status: AttendanceStatus) => Promise<void>;
  onMarkAllPresent: (groupStudents: Student[]) => Promise<void>;
  onAddStudent?: (student: Omit<Student, 'id'>) => Promise<void>;
}

export const DailyAttendanceCard: React.FC<DailyAttendanceCardProps> = ({
  students,
  payments,
  attendanceRecords,
  selectedDate,
  teacherId = '',
  onDateChange,
  onSaveSingleAttendance,
  onMarkAllPresent,
  onAddStudent,
}) => {
  // Groups are the days of the week except Friday
  const [selectedGroup, setSelectedGroup] = useState<string>('السبت');
  const [gradeInput, setGradeInput] = useState<string>('الصف الأول الثانوي');
  const [studentNameInput, setStudentNameInput] = useState<string>('');
  
  // Status & Validation alerts
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'warning';
    suggestedGroup?: string;
  } | null>(null);

  // Helper: Check if student has any record in monthly fees / payments
  const hasMonthlyFee = (studentId: string, studentName: string): boolean => {
    const cleanName = studentName.trim().toLowerCase();
    return payments.some(
      (p) =>
        (studentId && p.studentId === studentId) ||
        p.studentName.trim().toLowerCase() === cleanName
    );
  };

  // Helper: Check if student belongs to the selected day group
  const isStudentInGroup = (student: Student, group: string): boolean => {
    return (
      student.groupName === group ||
      student.dayOfWeek === group ||
      student.groupName === `مجموعة ${group}` ||
      group === `مجموعة ${student.dayOfWeek}`
    );
  };

  // Filter students belonging to this day / group
  const groupStudents = students.filter((s) => isStudentInGroup(s, selectedGroup));

  // Map of studentId -> attendance record for selectedDate
  const attendanceMap = new Map<string, AttendanceRecord>();
  attendanceRecords.forEach((r) => {
    attendanceMap.set(r.studentId, r);
  });

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const inputName = studentNameInput.trim();
    if (!inputName) {
      setStatusMessage({
        text: 'الرجاء إدخال اسم الطالب للتحضير.',
        type: 'warning'
      });
      return;
    }

    // 1. Look up student in registered students
    const matchedStudent = students.find(
      (s) => s.name.trim().toLowerCase() === inputName.toLowerCase()
    );

    // 2. CHECK RULE 1: Must be registered in monthly fees (الشهريات) first!
    const isEnrolledInFees = hasMonthlyFee(matchedStudent?.id || '', inputName);
    if (!isEnrolledInFees) {
      setStatusMessage({
        text: `عفواً! الطالب (${inputName}) غير مسجل في الشهريات. لا يمكن تسجيل الحضور اليومي إلا بعد تسجيله في الشهريات أولاً!`,
        type: 'error'
      });
      return;
    }

    // 3. CHECK RULE 2: Group validation! Must match selectedGroup.
    if (matchedStudent) {
      const studentCorrectGroup = matchedStudent.groupName || matchedStudent.dayOfWeek;
      if (!isStudentInGroup(matchedStudent, selectedGroup)) {
        setStatusMessage({
          text: `هذه المجموعة خطأ! الطالب مسجل في مجموعة يوم (${studentCorrectGroup}) وليس (${selectedGroup}). يرجى تغيير المجموعة للتحضير.`,
          type: 'error',
          suggestedGroup: studentCorrectGroup
        });
        return;
      }

      // Group is correct & registered in fees -> Record attendance!
      await onSaveSingleAttendance(matchedStudent, 'present');
      setStatusMessage({
        text: `تم تسجيل حضور الطالب (${matchedStudent.name}) في مجموعة يوم (${selectedGroup}) بنجاح! ✓`,
        type: 'success'
      });
    } else {
      // If student is in payments but not in students list, we know their registered group from payments if available
      const paymentRec = payments.find(
        (p) => p.studentName.trim().toLowerCase() === inputName.toLowerCase()
      );

      if (paymentRec && paymentRec.groupName && paymentRec.groupName !== 'عام') {
        if (!paymentRec.groupName.includes(selectedGroup) && paymentRec.groupName !== selectedGroup) {
          setStatusMessage({
            text: `هذه المجموعة خطأ! الطالب مسجل في مجموعة (${paymentRec.groupName}). يرجى تغيير المجموعة للتحضير.`,
            type: 'error',
            suggestedGroup: paymentRec.groupName
          });
          return;
        }
      }

      const studentData: Omit<Student, 'id'> = {
        name: inputName,
        parentPhone: paymentRec?.parentPhone || '',
        grade: gradeInput || paymentRec?.grade || 'الصف الأول الثانوي',
        groupName: selectedGroup,
        dayOfWeek: (DAYS_OF_WEEK.includes(selectedGroup as any) ? selectedGroup : 'السبت') as WeekDay,
        createdAt: Date.now(),
        teacherId,
      };

      if (onAddStudent) {
        await onAddStudent(studentData);
      }

      const tempStudent: Student = {
        id: 'manual_' + Date.now(),
        ...studentData
      };
      await onSaveSingleAttendance(tempStudent, 'present');
      setStatusMessage({
        text: `تم تسجيل حضور: (${inputName}) في مجموعة (${selectedGroup}) بنجاح! ✓`,
        type: 'success'
      });
    }

    setStudentNameInput('');
  };

  const handleStatusChange = async (student: Student, status: AttendanceStatus) => {
    setStatusMessage(null);

    // Validate Monthly Fees registration
    if (!hasMonthlyFee(student.id, student.name)) {
      setStatusMessage({
        text: `لا يمكن تسجيل الحضور: الطالب (${student.name}) غير مسجل في الشهريات! يرجى تسجيله في خانة الشهريات أولاً.`,
        type: 'error'
      });
      return;
    }

    // Validate Group
    if (!isStudentInGroup(student, selectedGroup)) {
      const studentCorrectGroup = student.groupName || student.dayOfWeek;
      setStatusMessage({
        text: `هذه المجموعة خطأ! الطالب مسجل في مجموعة (${studentCorrectGroup}).`,
        type: 'error',
        suggestedGroup: studentCorrectGroup
      });
      return;
    }

    await onSaveSingleAttendance(student, status);
  };

  // Mark all present - only for students who are registered in fees
  const handleMarkAllPresentClick = async () => {
    setStatusMessage(null);
    const eligibleStudents = groupStudents.filter((s) => hasMonthlyFee(s.id, s.name));
    const ineligibleStudents = groupStudents.filter((s) => !hasMonthlyFee(s.id, s.name));

    if (eligibleStudents.length === 0) {
      setStatusMessage({
        text: `لا يمكن تحضير طلاب مجموعة يوم ${selectedGroup}: لا يوجد أي طالب مسجل في الشهريات!`,
        type: 'error'
      });
      return;
    }

    await onMarkAllPresent(eligibleStudents);

    if (ineligibleStudents.length > 0) {
      setStatusMessage({
        text: `تم تحضير (${eligibleStudents.length}) طالب مسجلين بالشهريات. تم استثناء (${ineligibleStudents.length}) طلاب لعدم تسجيلهم في الشهريات بعد.`,
        type: 'warning'
      });
    } else {
      setStatusMessage({
        text: `تم تسجيل حضور جميع طلاب مجموعة يوم ${selectedGroup} بنجاح! ✓`,
        type: 'success'
      });
    }
  };

  const presentCount = groupStudents.filter(
    (s) => attendanceMap.get(s.id)?.status === 'present'
  ).length;
  const absentCount = groupStudents.filter(
    (s) => attendanceMap.get(s.id)?.status === 'absent'
  ).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">تسجيل الحضور اليومي</h3>
              <p className="text-xs text-slate-400">يشترط تسجيل الطالب بالشهريات وتطابق المجموعة</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs text-slate-600 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Validation Status / Error Message */}
        {statusMessage && (
          <div
            className={`p-3 mb-3 rounded-xl text-xs font-medium flex flex-col gap-2 animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {statusMessage.type === 'success' && <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />}
              {statusMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />}
              {statusMessage.type === 'error' && <XCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />}
              <span className="flex-1 leading-relaxed">{statusMessage.text}</span>
            </div>

            {/* Quick group switch suggestion button if user picked the wrong group */}
            {statusMessage.suggestedGroup && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroup(statusMessage.suggestedGroup!);
                    setStatusMessage(null);
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>تغيير المجموعة تلقائياً إلى ({statusMessage.suggestedGroup})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Group Selector & Grade */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 text-right">
              اختر المجموعة (أيام الأسبوع):
            </label>
            <select
              id="dailyGroup"
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setStatusMessage(null);
              }}
              className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold text-slate-800"
            >
              {DAYS_OF_WEEK.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 text-right">
              الصف الدراسي:
            </label>
            <select
              value={gradeInput}
              onChange={(e) => setGradeInput(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
            >
              {DEFAULT_GRADES.map((gr) => (
                <option key={gr} value={gr}>
                  {gr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Quick Add Form */}
        <form onSubmit={handleManualSave} className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1 text-right">
            اسم الطالب الحاضر (يجب أن يكون مسجلاً بالشهريات):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="dailyStudentName"
              value={studentNameInput}
              onChange={(e) => setStudentNameInput(e.target.value)}
              placeholder="اكتب اسم الطالب للتحضير..."
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition cursor-pointer"
            >
              تسجيل حضور اليوم
            </button>
          </div>
        </form>

        {/* Group Attendance List */}
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>طلاب مجموعة يوم {selectedGroup} ({groupStudents.length})</span>
            </div>
            {groupStudents.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllPresentClick}
                className="text-[11px] text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>تحضير الكل حاضر</span>
              </button>
            )}
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {groupStudents.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                لا يوجد طلاب مسجلون في مجموعة يوم {selectedGroup} حتى الآن. يمكنك إضافة الطلاب من خانة إدارة الطلاب ثم تسجيل شهرياتهم.
              </div>
            ) : (
              groupStudents.map((st) => {
                const currentStatus = attendanceMap.get(st.id)?.status;
                const inFees = hasMonthlyFee(st.id, st.name);

                return (
                  <div
                    key={st.id}
                    className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-xs hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 truncate max-w-[150px]">
                        {st.name}
                      </div>
                      <div className="mt-0.5">
                        {inFees ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            <span>مسجل بالشهريات</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5">
                            <XCircle className="w-2.5 h-2.5" />
                            <span>غير مسجل بالشهريات</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st, 'present')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                        }`}
                        title="حاضر"
                      >
                        حاضر
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(st, 'absent')}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700'
                        }`}
                        title="غائب"
                      >
                        غائب
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(st, 'late')}
                        className={`px-1.5 py-1 rounded-md text-[10px] font-medium transition cursor-pointer ${
                          currentStatus === 'late'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-800'
                        }`}
                        title="متأخر"
                      >
                        تأخير
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer counter */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="text-emerald-700 font-semibold">حاضر: {presentCount}</span>
        <span className="text-rose-700 font-semibold">غائب: {absentCount}</span>
        <span className="text-slate-400">يشترط التسجيل بالشهريات</span>
      </div>
    </div>
  );
};
