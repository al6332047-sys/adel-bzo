import React, { useState } from 'react';
import type { Student, AttendanceRecord, TeacherProfile } from '../types';
import { DAYS_OF_WEEK } from '../types';
import { generateWhatsAppLink, sendWhatsAppNotification, sendBatchAbsenceNotifications } from '../utils/helpers';
import { 
  BarChart3, 
  Send, 
  MessageSquare, 
  Copy, 
  Check, 
  UserX,
  Zap,
  Bot,
  Loader2,
  CheckCheck,
  AlertCircle
} from 'lucide-react';

interface AbsenceAnalysisCardProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  profile: TeacherProfile;
}

interface AbsentStudentInfo {
  student: Student;
  reason?: string;
  phone: string;
  messageText: string;
  whatsappLink: string;
}

export const AbsenceAnalysisCard: React.FC<AbsenceAnalysisCardProps> = ({
  students,
  attendanceRecords,
  selectedDate,
  profile,
}) => {
  const [analysisGroup, setAnalysisGroup] = useState<string>('السبت');
  const [analyzed, setAnalyzed] = useState<boolean>(false);
  const [absentStudents, setAbsentStudents] = useState<AbsentStudentInfo[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // CallMeBot Sending State: { [studentId]: 'idle' | 'sending' | 'sent' | 'error' }
  const [sendingStatus, setSendingStatus] = useState<Record<string, 'sending' | 'sent' | 'error'>>({});
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [alertFeedback, setAlertFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeApiKey = profile.callMeBotApiKey || '2155589';

  const handleAnalyzeAbsence = () => {
    // 1. Find all students belonging to this day / group
    const groupStudents = students.filter(
      (s) =>
        s.groupName === analysisGroup ||
        s.dayOfWeek === analysisGroup ||
        s.groupName === `مجموعة ${analysisGroup}` ||
        analysisGroup === `مجموعة ${s.dayOfWeek}`
    );

    // 2. Find attendance records for selectedDate
    const attendanceMap = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach((r) => {
      if (r.date === selectedDate) {
        attendanceMap.set(r.studentId, r);
      }
    });

    const absents: AbsentStudentInfo[] = [];

    groupStudents.forEach((st) => {
      const rec = attendanceMap.get(st.id);
      // Student is considered absent if explicitly marked 'absent', or if attendance was recorded for some but this student wasn't marked present
      const isAbsent = rec ? rec.status === 'absent' : false;

      if (isAbsent || (!rec && attendanceRecords.length > 0)) {
        // Construct standard CallMeBot message requested by user
        const customMessage = `تنبيه غياب: ولي الأمر المحترم، نود إعلامكم أن الطالب/ة (${st.name}) متغيب عن المدرسة بتاريخ ${selectedDate}. برجاء المتابعة.`;

        absents.push({
          student: st,
          phone: st.parentPhone,
          messageText: customMessage,
          whatsappLink: generateWhatsAppLink(st.parentPhone, customMessage),
        });
      }
    });

    setAbsentStudents(absents);
    setAnalyzed(true);
    setSendingStatus({});
    setAlertFeedback(null);
  };

  // Send single WhatsApp notification via CallMeBot in background
  const handleSendCallMeBot = async (item: AbsentStudentInfo) => {
    if (!item.phone) {
      alert('لا يوجد رقم هاتف مسجل لولي أمر هذا الطالب.');
      return;
    }

    setSendingStatus((prev) => ({ ...prev, [item.student.id]: 'sending' }));

    const res = await sendWhatsAppNotification(
      item.phone,
      item.student.name,
      selectedDate,
      activeApiKey
    );

    if (res.success) {
      setSendingStatus((prev) => ({ ...prev, [item.student.id]: 'sent' }));
      setAlertFeedback({
        type: 'success',
        message: `تم إرسال إشعار الغياب بنجاح لـ: ${item.student.name} (${item.phone}) عبر واتساب!`
      });
      setTimeout(() => setAlertFeedback(null), 4500);
    } else {
      setSendingStatus((prev) => ({ ...prev, [item.student.id]: 'error' }));
      setAlertFeedback({
        type: 'error',
        message: `حدث خطأ أثناء إرسال الرسالة لـ: ${item.student.name}.`
      });
      setTimeout(() => setAlertFeedback(null), 4500);
    }
  };

  // Send to all absent students sequentially in background
  const handleSendAllCallMeBot = async () => {
    const validStudents = absentStudents.filter((item) => !!item.phone);
    if (validStudents.length === 0) {
      setAlertFeedback({
        type: 'error',
        message: 'لا يوجد أرقام هواتف متاحة للمتغيبين لإرسال الإشعارات.'
      });
      return;
    }

    // Alert feedback message as specified by user
    setAlertFeedback({
      type: 'success',
      message: 'جاري إرسال رسائل الغياب لجميع أولياء الأمور في القائمة!'
    });

    setIsBatchSending(true);
    setBatchProgress({ current: 0, total: validStudents.length });

    const batchList = validStudents.map((item) => ({
      name: item.student.name,
      phone: item.phone,
      date: selectedDate
    }));

    await sendBatchAbsenceNotifications(
      batchList,
      activeApiKey,
      (current, total, studentName) => {
        setBatchProgress({ current, total });
        const targetStudent = validStudents[current - 1];
        if (targetStudent) {
          setSendingStatus((prev) => ({ ...prev, [targetStudent.student.id]: 'sent' }));
        }
      }
    );

    setIsBatchSending(false);
    setBatchProgress(null);
    setAlertFeedback({
      type: 'success',
      message: `تم إرسال كافة إشعارات الغياب بنجاح لـ (${validStudents.length}) ولي أمر! 🚀`
    });
    setTimeout(() => setAlertFeedback(null), 5000);
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">تحليل الغياب وإرسال أولياء الأمور</h3>
              <p className="text-xs text-slate-400">إرسال إشعارات واتساب تلقائية في الخلفية عبر CallMeBot</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-xl">
            <span>تاريخ: {selectedDate}</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {alertFeedback && (
          <div
            className={`p-3 mb-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
              alertFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {alertFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alertFeedback.message}</span>
          </div>
        )}

        {/* Group Selector - Days of week except Friday */}
        <div className="form-group mb-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1 text-right">
            اختر المجموعة للتحليل (أيام الأسبوع):
          </label>
          <select
            id="analysisGroup"
            value={analysisGroup}
            onChange={(e) => {
              setAnalysisGroup(e.target.value);
              setAnalyzed(false);
              setAlertFeedback(null);
            }}
            className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none text-slate-800"
          >
            {DAYS_OF_WEEK.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleAnalyzeAbsence}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer mb-3"
        >
          <BarChart3 className="w-4 h-4" />
          <span>تحليل الطلاب المتغيبين</span>
        </button>

        {/* Batch send all button if absentees found */}
        {analyzed && absentStudents.length > 0 && (
          <div className="mb-3">
            <button
              type="button"
              disabled={isBatchSending}
              onClick={handleSendAllCallMeBot}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isBatchSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    جارٍ إرسال الإشعارات ({batchProgress?.current} من {batchProgress?.total})...
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>إرسال إشعارات الغياب لجميع المتغيبين تلقائياً ({absentStudents.length})</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Container */}
        <div
          id="absenceResults"
          className="min-h-[140px] max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/70 text-xs divide-y divide-slate-200/70 space-y-2"
        >
          {!analyzed ? (
            <div className="flex flex-col items-center justify-center text-center py-6 text-slate-400 gap-1.5">
              <MessageSquare className="w-6 h-6 text-slate-300" />
              <span>اضغط على تحليل لعرض الطلاب المتغيبين مع خيارات الإرسال التلقائي...</span>
            </div>
          ) : absentStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-6 text-emerald-600 gap-1.5">
              <Check className="w-7 h-7 bg-emerald-100 p-1 rounded-full text-emerald-600" />
              <span className="font-bold">لا يوجد طلاب متغيبون في هذه المجموعة لهذا اليوم.</span>
              <span className="text-[11px] text-slate-500">كافة الطلاب حاضرون أو لم يتم تسجيل غياب.</span>
            </div>
          ) : (
            absentStudents.map((item, idx) => {
              const status = sendingStatus[item.student.id];

              return (
                <div
                  key={item.student.id + idx}
                  className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5 text-rose-500" />
                      <span>الطالب: {item.student.name}</span>
                      <span className="text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-md font-semibold">
                        (غائب)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>
                        ولي الأمر:{' '}
                        <span className="font-mono text-slate-700">
                          {item.phone || 'غير مسجل'}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {/* Copy text button */}
                    <button
                      type="button"
                      onClick={() => copyMessage(item.student.id, item.messageText)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] flex items-center gap-1 transition cursor-pointer"
                      title="نسخ نص الرسالة"
                    >
                      {copiedId === item.student.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Automatic Background WhatsApp Send Button via CallMeBot */}
                    <button
                      type="button"
                      disabled={status === 'sending'}
                      onClick={() => handleSendCallMeBot(item)}
                      className={`flex items-center gap-1.5 font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition shadow-xs cursor-pointer ${
                        status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : status === 'sending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title="إرسال إشعار غياب تلقائي في الخلفية دون فتح واتساب"
                    >
                      {status === 'sending' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>جارٍ الإرسال...</span>
                        </>
                      ) : status === 'sent' ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>تم الإرسال ✓</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5" />
                          <span>إشعار تلقائي (CallMeBot)</span>
                        </>
                      )}
                    </button>

                    {/* Direct WhatsApp Web Link */}
                    {item.phone && (
                      <a
                        href={item.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-whatsapp flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2 py-1.5 rounded-lg text-[11px] transition"
                        title="فتح محادثة واتساب العادية"
                      >
                        <Send className="w-3 h-3 rotate-180 text-emerald-600" />
                        <span>فتح واتساب</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>المتغيبون: {analyzed ? absentStudents.length : 0} طالب</span>
        <div className="flex items-center gap-1 text-emerald-700 font-medium">
          <Bot className="w-3.5 h-3.5" />
          <span>CallMeBot مفعل (API: {activeApiKey})</span>
        </div>
      </div>
    </div>
  );
};
