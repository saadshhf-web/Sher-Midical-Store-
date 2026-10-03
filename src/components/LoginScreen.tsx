import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StoreLogoImage } from './DefaultLogo';

export const LoginScreen: React.FC = () => {
  const { settings, login } = useStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (!success) {
      setError('Invalid username or password. Please use admin / admin123');
    }
  };

  const handleFillDemo = () => {
    setUsername(settings.username || 'admin');
    setPassword(settings.passwordHash || 'admin123');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex items-center justify-center p-4">
      {/* Decorative backdrop glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header section with Logo & Store Name */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 text-center">
          <div className="flex justify-center mb-3">
            <StoreLogoImage
              logoUrl={settings.storeLogo}
              size="lg"
              className="shadow-md"
            />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {settings.storeName || 'SHER MEDICAL STORE'}
          </h1>
          <p className="text-xs font-semibold text-emerald-700 mt-0.5">
            {settings.urduName || 'شیر میڈیکل اسٹور'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {settings.subtitle || 'Complete Medical Store Management System'}
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span className="font-semibold text-slate-700">Account Sign In</span>
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" /> Offline Secured
            </span>
          </div>

          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick autofill helper */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-700">Default Credentials:</span>{' '}
              <span className="font-mono text-slate-600">admin / admin123</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-emerald-700 hover:text-emerald-800 font-semibold underline text-[11px]"
            >
              Fill In
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In to System</span>
          </button>
        </form>

        <div className="p-3 bg-slate-100 text-center border-t border-slate-200 text-[11px] text-slate-400">
          Powered by Offline IndexedDB Engine • Sher Medical Store
        </div>
      </div>
    </div>
  );
};
