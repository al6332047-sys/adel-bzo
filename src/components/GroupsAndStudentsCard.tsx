import React, { useState, useRef } from 'react';
import type { Student, WeekDay } from '../types';
import { DAYS_OF_WEEK, DEFAULT_GRADES } from '../types';
import { generateWhatsAppLink } from '../utils/helpers';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Trash2, 
  MessageCircle, 
  CalendarDays, 
  Check,
  GraduationCap
} from 'lucide-react';

interface GroupsAndStudentsCardProps {
  students: Student[];
  teacherId: string;
  onAddStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  onDeleteStudent: (id: string, name?: string) => Promise<void>;
}

export const GroupsAndStudentsCard: React.FC<GroupsAndStudentsCardProps> = ({
  students,
  teacherId,
  onAddStudent,
  onDeleteStudent,
}) => {
  const [selectedDay, setSelectedDay] = useState<WeekDay>('السبت');
  const [studentName, setStudentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [grade, setGrade] = useState('الصف الأول الثانوي');
  const [notes, setNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Ref for immediate focus on next student
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Filter students for the active day / group
  const dayStudents = students.filter(
    (s) =>
      s.dayOfWeek === selectedDay ||
      s.groupName === selectedDay ||
      s.groupName === `مجموعة ${selectedDay}`
  );

  const handleSelectDay = (day: WeekDay) => {
    setSelectedDay(day);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentName.trim();
    const cleanPhone = parentPhone.trim();

    if (!cleanName) {
      alert('الرجاء إدخال اسم الطالب');
      return;
    }
    if (!cleanPhone) {
      alert('الرجاء إدخال رقم تليفون ولي الأمر للتواصل والواتساب');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddStudent({
        name: cleanName,
        parentPhone: cleanPhone,
        studentPhone: studentPhone.trim() || '',
        grade,
        groupName: selectedDay,
        dayOfWeek: selectedDay,
        notes: notes.trim() || '',
        createdAt: Date.now(),
        teacherId,
      });

      // Clear form inputs immediately so the teacher can add the next student right away!
      setStudentName('');
      setParentPhone('');
      setStudentPhone('');
      setNotes('');

      // Status message
      setStatusMessage(`تمت إضافة الطالب (${cleanName}) إلى مجموعة يوم ${selectedDay} بنجاح! ✓`);
      setTimeout(() => setStatusMessage(null), 3000);

      // Focus back on student name input
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة الطالب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">إدارة الطلاب والمجموعات والأيام</h3>
              <p className="text-xs text-slate-400">توزيع الطلاب وجداول أيام الأسبوع</p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl">
            {students.length} طالب مسجل
          </span>
        </div>

        {statusMessage && (
          <div className="p-2.5 mb-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Days selector bar - All days except Friday */}
        <div className="days-container flex gap-1 mb-3 overflow-x-auto pb-1">
          {DAYS_OF_WEEK.map((day) => {
            const count = students.filter(
              (s) =>
                s.dayOfWeek === day ||
                s.groupName === day ||
                s.groupName === `مجموعة ${day}`
            ).length;
            const isActive = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center relative ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span
                    className={`mr-1 text-[10px] px-1 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add Student Form - Always visible and auto-clearing */}
        <form onSubmit={handleAddStudent} className="space-y-2.5 mb-4 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>إضافة طالب لمجموعة يوم ({selectedDay})</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">يتم الإضافة فوراً وتفريغ الحقل</span>
          </div>

          <div>
            <input
              ref={nameInputRef}
              type="text"
              id="groupStudentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="اسم الطالب ثلاثي..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="tel"
                id="parentPhone"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="رقم ولي الأمر 01xxxxxxxx"
                dir="ltr"
                className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-right font-mono"
                required
              />
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>

            <div>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none"
              >
                {DEFAULT_GRADES.map((gr) => (
                  <option key={gr} value={gr}>
                    {gr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !studentName.trim() || !parentPhone.trim()}
            className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span>إضافة للمجموعة</span>
          </button>
        </form>

        {/* Live List of Students in This Group - Appears directly below the form */}
        <div>
          <div className="flex items-center justify-between mb-2 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>طلاب مجموعة يوم {selectedDay} ({dayStudents.length})</span>
            </span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {dayStudents.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                لا يوجد طلاب مضافون في يوم {selectedDay} بعد. أضف الطالب بالأعلى وسيظهر هنا مباشرة!
              </div>
            ) : (
              dayStudents.map((st) => (
                <div
                  key={st.id}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition"
                >
                  <div>
                    <div className="font-bold text-slate-800">{st.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{st.grade}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-700">{st.parentPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {st.parentPhone && (
                      <a
                        href={generateWhatsAppLink(
                          st.parentPhone,
                          `السلام عليكم ورحمة الله، مرحباً بولي أمر الطالب ${st.name}`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                        title="محادثة واتساب مباشرة"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}

                    {confirmDeleteId === st.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg animate-in fade-in">
                        <span className="text-[10px] text-rose-700 font-bold">تأكيد الحذف؟</span>
                        <button
                          type="button"
                          onClick={async () => {
                            setConfirmDeleteId(null);
                            setStatusMessage(`تم حذف الطالب (${st.name}) بنجاح! ✓`);
                            setTimeout(() => setStatusMessage(null), 3000);
                            await onDeleteStudent(st.id, st.name);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                        >
                          نعم
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] transition cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(st.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="حذف الطالب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>يوم {selectedDay}: {dayStudents.length} طالب</span>
        <span className="text-indigo-600 font-medium">إضافة فورية مستمرة</span>
      </div>
    </div>
  );
};
