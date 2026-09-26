import React, { useState } from 'react';
import type { TeacherProfile } from '../types';
import { UserCheck, X, Save, MessageSquare, BookOpen, Building2 } from 'lucide-react';

interface TeacherProfileModalProps {
  profile: TeacherProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<TeacherProfile>) => Promise<void>;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<TeacherProfile>({ ...profile });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">إعدادات ملف المعلم والأكاديمية</h3>
              <p className="text-xs text-slate-500">تخصيص بيانات الأستاذ ورسائل الواتساب</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم المعلم / الأستاذ:
            </label>
            <input
              type="text"
              value={formData.teacherName}
              onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
              placeholder="مثال: أستاذ عبد الرازق"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>المادة الدراسية:</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="مثال: لغة عربية"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>اسم السنتر / القاعة:</span>
              </label>
              <input
                type="text"
                value={formData.centerName}
                onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                placeholder="مثال: سنتر النور"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>قالب رسالة الواتساب للغياب:</span>
            </label>
            <textarea
              rows={3}
              value={formData.whatsappTemplate}
              onChange={(e) => setFormData({ ...formData, whatsappTemplate: e.target.value })}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              المتغيرات المتاحة: <code className="text-indigo-600 font-mono">{"{student_name}"}</code>، <code className="text-indigo-600 font-mono">{"{group_name}"}</code>، <code className="text-indigo-600 font-mono">{"{date}"}</code>، <code className="text-indigo-600 font-mono">{"{teacher_name}"}</code>
            </p>
          </div>

          {/* CallMeBot API Settings */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span>🤖 إعدادات CallMeBot (إرسال تلقائي في الخلفية)</span>
              </span>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                مفعل جاهز
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  مفتاح الـ API (API Key):
                </label>
                <input
                  type="text"
                  value={formData.callMeBotApiKey || '2155589'}
                  onChange={(e) => setFormData({ ...formData, callMeBotApiKey: e.target.value })}
                  placeholder="2155589"
                  dir="ltr"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  رقم الهاتف المربوط:
                </label>
                <input
                  type="text"
                  value={formData.callMeBotPhone || '201559735253'}
                  onChange={(e) => setFormData({ ...formData, callMeBotPhone: e.target.value })}
                  placeholder="201559735253"
                  dir="ltr"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-emerald-700">
              يتم إرسال إشعارات الغياب تلقائياً لأولياء الأمور في الخلفية دون الحاجة لفتح تطبيق واتساب.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
