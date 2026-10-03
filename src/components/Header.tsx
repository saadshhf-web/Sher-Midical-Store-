import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertTriangle,
  Clock,
  WifiOff,
  LogOut,
  UserCheck,
  Menu,
  X,
  BellRing,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StoreLogoImage } from './DefaultLogo';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const {
    settings,
    currentUser,
    logout,
    medicines,
    globalSearch,
    setGlobalSearch,
    setCurrentTab,
  } = useStore();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-PK', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate live alert counts
  const now = new Date();
  const lowStockCount = medicines.filter(
    (m) => m.quantity > 0 && m.quantity <= (m.minStock || settings.minStockDefault)
  ).length;

  const expiredCount = medicines.filter((m) => {
    if (!m.expiryDate) return false;
    return new Date(m.expiryDate) < now;
  }).length;

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Store Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          title="Toggle Navigation"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setCurrentTab('dashboard')}
          title="Go to Dashboard"
        >
          <StoreLogoImage logoUrl={settings.storeLogo} size="md" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight group-hover:text-emerald-700 transition-colors">
                {settings.storeName || 'SHER MEDICAL STORE'}
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                {settings.urduName || 'شیر میڈیکل اسٹور'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden md:block">
              {settings.subtitle || 'Complete Medical Store Management System'}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Global Fast Medicine Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              if (e.target.value.trim().length > 0) {
                setCurrentTab('medicines');
              }
            }}
            placeholder="Search medicine, generic, barcode, company..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right: Status Badges, Clock, User & Logout */}
      <div className="flex items-center gap-2.5">
        {/* Offline Ready Badge */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold"
          title="Application is running offline-first locally with IndexedDB storage"
        >
          <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
          <span>Offline Ready</span>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1 text-slate-500 text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime || 'Syncing clock...'}</span>
        </div>

        {/* Low Stock Alert Bubble */}
        {lowStockCount > 0 && (
          <button
            onClick={() => setCurrentTab('stock')}
            className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-semibold hover:bg-amber-100 transition-colors"
            title={`${lowStockCount} medicines running low on stock`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Low:</span>
            <span className="bg-amber-600 text-white rounded-full px-1.5 text-[10px]">
              {lowStockCount}
            </span>
          </button>
        )}

        {/* Expired Alert Bubble */}
        {expiredCount > 0 && (
          <button
            onClick={() => setCurrentTab('expiry')}
            className="flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-xs font-semibold hover:bg-rose-100 transition-colors animate-pulse"
            title={`${expiredCount} medicines expired!`}
          >
            <BellRing className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Expired:</span>
            <span className="bg-rose-600 text-white rounded-full px-1.5 text-[10px]">
              {expiredCount}
            </span>
          </button>
        )}

        {/* Current User & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 py-1 px-2.5 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentUser || 'Admin'}</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
