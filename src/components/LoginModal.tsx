import React, { useState } from 'react';
import { auth, signInAnonymously } from '../lib/firebase';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  onSuccess: () => void;
}

// Helper to convert Eastern Arabic digits (٠١٢٣٤٥٦٧٨٩) to standard English digits (0123456789)
const normalizeArabicDigits = (str: string): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => arabicDigits.indexOf(w).toString());
};

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Normalize input: trim, remove zero-width spaces, convert Arabic digits
    const cleanInput = normalizeArabicDigits(
      password.trim().replace(/[\u200B-\u200D\uFEFF]/g, '')
    );

    // Accept exact match 'Emooo@1212', case-insensitive 'emooo@1212', common typo 'emoo@1212' or '1212'
    const isMatch =
      cleanInput === 'Emooo@1212' ||
      cleanInput.toLowerCase() === 'emooo@1212' ||
      cleanInput.toLowerCase() === 'emoo@1212' ||
      cleanInput.toLowerCase() === 'emoooo@1212' ||
      cleanInput.toLowerCase() === 'emooo1212' ||
      cleanInput === '1212' ||
      cleanInput === '١٢١٢';

    if (isMatch) {
      setLoading(true);
      try {
        // Attempt anonymous sign in if not already signed in
        if (!auth.currentUser) {
          await signInAnonymously(auth).catch((authErr) => {
            console.warn('Anonymous auth note (using fallback teacher session):', authErr);
          });
        }
      } catch (err) {
        console.warn('Auth proceeding with session fallback:', err);
      } finally {
        setLoading(false);
        onSuccess();
      }
    } else {
      setErrorMsg('كلمة السر غير صحيحة! تأكد من الحروف الإنجليزية والرمز (Emooo@1212) وحاول مرة أخرى.');
    }
  };

  return (
    <div id="loginOverlay" className="fixed inset-0 z-50 flex items-center justify-center bg-[#f4f6f9] p-4">
      <div className="login-box bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-[420px] text-center border border-slate-200">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">
          تسجيل دخول النظام
        </h2>

        <form onSubmit={handlePasswordLogin} className="space-y-5 text-right">
          <div className="form-group text-right">
            <label className="block text-sm font-medium text-slate-700 mb-2 text-right">
              أدخل كلمة السر:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="passwordInput"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="كلمة المرور..."
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-right pr-10 pl-10"
                autoFocus
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 transition absolute left-3 top-3 cursor-pointer"
                title={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              id="errorMsg"
              className="error-msg flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>دخول</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
