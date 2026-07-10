import React, { useState } from 'react';
import { User } from 'lucide-react';

interface LoginViewProps {
  onLogin: (name: string) => void;
}

const SUPERVISORS = [
  'ساجدی', 'ناصری', 'حمزه وی', 'پردل', 
  'ریحانی', 'میرزایی', 'پزشکی', 'ربانی', 'گلزاده', 
  'شاطریان', 'آزاده', 'رجبی', 'الهیاری', 
  'غزالی', 'آقایی زاده ترابی', 'اسکندری'
];

export function LoginView({ onLogin }: LoginViewProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInput = name.trim();
    if (normalizedInput) {
      const isSupervisor = SUPERVISORS.some(supervisor => normalizedInput.includes(supervisor));
      if (isSupervisor) {
        onLogin(normalizedInput.startsWith('مهندس') ? normalizedInput : `مهندس ${normalizedInput}`);
      } else {
        onLogin('کاربر');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6 flex justify-center items-center">
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/8/84/Mashhad_University_of_Medical_Sciences_%28emblem%29.jpg" 
              alt="لوگوی دانشگاه علوم پزشکی مشهد" 
              className="h-28 object-contain mix-blend-multiply"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">گزارش پیشرفت پروژه ها</h1>
          <p className="text-gray-500 mt-2 text-center text-sm">لطفا نام خود را برای ورود به سیستم وارد کنید.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نام و نام خانوادگی</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="مثال: علی رضایی"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-colors cursor-pointer"
          >
            ورود به سیستم
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs font-light">یا</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <button
          type="button"
          onClick={() => onLogin('کاربر')}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
        >
          ورود به عنوان کاربر عادی
        </button>
      </div>
    </div>
  );
}
