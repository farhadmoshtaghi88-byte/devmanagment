import React, { useState } from 'react';
import {
  Briefcase,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Server,
  DollarSign
} from 'lucide-react';
import { DEFAULT_USERS, toPersianDigits } from '../constants';
import { LOCAL_STORAGE_KEY } from '../context/DataContext';
import { SystemUser } from '../types';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      try {
        const savedUsersRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
        const usersList: SystemUser[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : DEFAULT_USERS;

        const trimmedUser = username.trim().toLowerCase();
        const found = usersList.find(
          (u) =>
            (u.username.toLowerCase() === trimmedUser || (u.email && u.email.toLowerCase() === trimmedUser)) &&
            u.password === password
        );

        if (!found) {
          setError('نام کاربری یا رمز عبور نادرست است.');
          setIsLoading(false);
          return;
        }
        if (!found.isActive) {
          setError('این حساب کاربری غیرفعال شده است. با مدیر سیستم تماس بگیرید.');
          setIsLoading(false);
          return;
        }

        if (rememberMe) {
          localStorage.setItem('shaygan_auth_logged_in', 'true');
          localStorage.setItem('shaygan_auth_user_id', found.id);
        } else {
          sessionStorage.setItem('shaygan_auth_logged_in', 'true');
          sessionStorage.setItem('shaygan_auth_user_id', found.id);
        }
        onLogin();
      } catch {
        setError('خطا در بررسی اطلاعات ورود.');
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-['Vazirmatn']" dir="rtl">
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl relative z-10">
        {/* Brand Side */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-slate-800">
          <div>
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/40">
                <Briefcase size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">پنل مدیریت پروژه شایگان</h1>
                <p className="text-[11px] text-indigo-300 font-medium">سیستم جامع مالی، پروژه‌ها و زیرساخت</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">داشبورد تحلیلی و سود خالص</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">محاسبه دقیق سود قراردادها، جریان نقدی و هزینه‌ها</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">پیگیری مطالبات و حساب‌های بانکی</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">کنترل دقیق مانده قراردادها و تفکیک کارت و حساب مقصد</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl shrink-0">
                  <Server size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">مدیریت زیرساخت و سرورها</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">هشدار سررسید تمدید، مشخصات فنی و آی‌پی‌ها</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck size={16} /> احراز هویت امن کاربران
            </span>
            <span className="text-[11px] text-slate-500">نسخه {toPersianDigits('3.0')}</span>
          </div>
        </div>

        {/* Form Side */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-slate-900/60">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">ورود به حساب کاربری</h2>
              <p className="text-xs text-slate-400 mt-1.5">
                جهت دسترسی به داشبورد و سوابق مالی مشخصات خود را وارد نمایید.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">نام کاربری یا ایمیل</label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pr-11 pl-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">رمز عبور</label>
                  <span className="text-[10px] text-slate-500">پیش‌فرض: {toPersianDigits('123456')}</span>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-11 pl-11 py-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-lg bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  مرا به خاطر بسپار
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <span>در حال اعتبارسنجی...</span>
                ) : (
                  <>
                    <span>ورود به پنل مدیریت شایگان</span>
                    <ArrowLeft size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
