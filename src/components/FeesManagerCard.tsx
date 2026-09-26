import React, { useState } from 'react';
import type { Student, PaymentRecord } from '../types';
import { MONTHS_LIST } from '../types';
import { getTodayDateString } from '../utils/helpers';
import { 
  Banknote, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Receipt, 
  PlusCircle, 
  Clock, 
  User, 
  Filter
} from 'lucide-react';

interface FeesManagerCardProps {
  students: Student[];
  payments: PaymentRecord[];
  teacherId: string;
  onSavePayment: (payment: Omit<PaymentRecord, 'id'>) => Promise<void>;
  onToggleStatus: (id: string, newStatus: 'paid' | 'unpaid') => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
}

export const FeesManagerCard: React.FC<FeesManagerCardProps> = ({
  students,
  payments,
  teacherId,
  onSavePayment,
  onToggleStatus,
  onDeletePayment,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form inputs
  const [studentName, setStudentName] = useState('');
  const [feeStatus, setFeeStatus] = useState<'paid' | 'unpaid'>('paid');
  const [feeMonth, setFeeMonth] = useState('أكتوبر 2026');
  const [feeType, setFeeType] = useState<PaymentRecord['type']>('monthly');
  const [amount, setAmount] = useState<number>(150);
  const [notes, setNotes] = useState('');
  
  // Filtering table
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleSearch = () => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchInput.trim().toLowerCase();
    const results = students.filter(s => s.name.toLowerCase().includes(q));
    setSearchResults(results);
    
    if (results.length === 1) {
      chooseStudent(results[0]);
    } else if (results.length === 0) {
      setStudentName(searchInput.trim());
      setStatusMessage({ text: `لم يتم العثور على طالب مسجل باسم "${searchInput}"، يمكنك حفظ السداد باسم جديد`, type: 'info' });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const chooseStudent = (st: Student) => {
    setSelectedStudent(st);
    setStudentName(st.name);
    setSearchInput(st.name);
    setSearchResults([]);
    setStatusMessage({ text: `تم اختيار الطالب: ${st.name}`, type: 'success' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('الرجاء إدخال اسم الطالب أولاً!');
      return;
    }

    const typeLabels: Record<PaymentRecord['type'], string> = {
      monthly: 'اشتراك شهري',
      notes: 'مذكرة / ملزمة',
      exam: 'اختبار شامل',
      other: 'رسوم أخرى'
    };

    try {
      await onSavePayment({
        studentId: selectedStudent ? selectedStudent.id : '',
        studentName: studentName.trim(),
        parentPhone: selectedStudent?.parentPhone || '',
        grade: selectedStudent?.grade || 'عام',
        groupName: selectedStudent?.groupName || 'عام',
        month: feeMonth,
        type: feeType,
        typeLabel: typeLabels[feeType],
        amount: Number(amount) || 0,
        status: feeStatus,
        date: getTodayDateString(),
        notes: notes.trim(),
        teacherId
      });

      setStatusMessage({ text: 'تم حفظ بيانات الشهريات والمذكرات بنجاح! 💰', type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);

      // reset inputs immediately so teacher can add next student
      setStudentName('');
      setSearchInput('');
      setSelectedStudent(null);
      setNotes('');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ السداد.');
    }
  };

  // Filtered payments list
  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.studentName.toLowerCase().includes(filterQuery.toLowerCase()) ||
                          p.month.toLowerCase().includes(filterQuery.toLowerCase()) ||
                          p.typeLabel.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' ? true : p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const totalUnpaid = payments.filter(p => p.status === 'unpaid').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        {/* Card Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">تسجيل الشهريات والمذكرات</h3>
              <p className="text-xs text-slate-400">إدارة الاشتراكات والملازم الدراسية</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{showHistory ? 'نموذج التسجيل' : 'سجل العمليات (' + payments.length + ')'}</span>
          </button>
        </div>

        {statusMessage && (
          <div className={`p-2.5 mb-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {!showHistory ? (
          /* Form View */
          <form onSubmit={handleSaveFees} className="space-y-3">
            {/* Search Student Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1 text-right">
                بحث عن اسم الطالب:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id="searchStudentInput"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                    placeholder="اكتب اسم الطالب للبحث..."
                    className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  بحث
                </button>
              </div>

              {/* Autocomplete Suggestions */}
              {searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => chooseStudent(s)}
                      className="w-full text-right px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800">{s.name}</span>
                      <span className="text-[11px] text-slate-400">{s.groupName} - {s.grade}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 text-right">
                اسم الطالب:
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="feeStudentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="اسم الطالب"
                  className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            {/* Type & Month */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 text-right">
                  نوع الرسوم:
                </label>
                <select
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value as any)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                >
                  <option value="monthly">اشتراك شهري</option>
                  <option value="notes">مذكرة / ملزمة</option>
                  <option value="exam">امتحان شامل</option>
                  <option value="other">رسوم أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 text-right">
                  الشهر / الفترة:
                </label>
                <select
                  value={feeMonth}
                  onChange={(e) => setFeeMonth(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                >
                  {MONTHS_LIST.map((m) => (
                    <option key={m} value={`${m} 2026`}>{m} 2026</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount & Fee Status */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 text-right">
                  المبلغ (ج.م):
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="150"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-semibold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 text-right">
                  حالة السداد:
                </label>
                <select
                  id="feeStatus"
                  value={feeStatus}
                  onChange={(e) => setFeeStatus(e.target.value as any)}
                  className={`w-full px-2.5 py-2 text-xs font-bold rounded-xl border focus:outline-none ${
                    feeStatus === 'paid' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <option value="paid">دفع الاشتراكات (تم السداد)</option>
                  <option value="unpaid">لم يدفع (متبقي عليه)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>حفظ البيانات</span>
            </button>
          </form>
        ) : (
          /* Table of Payments History View */
          <div className="space-y-3">
            {/* Filter Bar */}
            <div className="flex gap-2 text-xs">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="بحث في السجلات..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="all">الكل ({payments.length})</option>
                <option value="paid">مسدد</option>
                <option value="unpaid">متبقي</option>
              </select>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  لا توجد سجلات مطابقة للبحث
                </div>
              ) : (
                filteredPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{p.studentName}</span>
                        <span className="text-[10px] font-normal bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {p.typeLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{p.month}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{p.amount} ج.م</span>
                        <span>•</span>
                        <span>{p.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(p.id, p.status === 'paid' ? 'unpaid' : 'paid')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                          p.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {p.status === 'paid' ? 'مدفوع ✓' : 'متبقي ✗'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePayment(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="حذف السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals Summary */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
              <span className="text-emerald-700 font-semibold">المحصل: {totalPaid} ج.م</span>
              <span className="text-rose-700 font-semibold">المتبقي: {totalUnpaid} ج.م</span>
            </div>
          </div>
        )}
      </div>

      {/* Mini footer */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>إجمالي السجلات: {payments.length}</span>
        <span className="text-emerald-600 font-medium">سداد فوري ومحفوظ سحابياً</span>
      </div>
    </div>
  );
};
