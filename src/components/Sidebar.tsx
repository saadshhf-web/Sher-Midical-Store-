import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Truck,
  Receipt,
  Users,
  Building2,
  PackageSearch,
  CalendarX,
  WalletCards,
  TrendingUp,
  FileBarChart2,
  Database,
  Settings,
  LogOut,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { NavigationTab } from '../types';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const {
    currentTab,
    setCurrentTab,
    logout,
    medicines,
    settings,
  } = useStore();

  const now = new Date();
  const lowStockCount = medicines.filter(
    (m) => m.quantity > 0 && m.quantity <= (m.minStock || settings.minStockDefault)
  ).length;

  const expiredCount = medicines.filter((m) => {
    if (!m.expiryDate) return false;
    return new Date(m.expiryDate) < now;
  }).length;

  const menuItems: {
    id: NavigationTab;
    label: string;
    urduLabel?: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      urduLabel: 'ڈیش بورڈ',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'pos',
      label: 'POS / New Sale',
      urduLabel: 'سیل کاؤنٹر',
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      id: 'medicines',
      label: 'Medicines',
      urduLabel: 'ادویات',
      icon: <Pill className="w-4 h-4" />,
      badge: medicines.length,
    },
    {
      id: 'purchases',
      label: 'Purchases',
      urduLabel: 'خریداری',
      icon: <Truck className="w-4 h-4" />,
    },
    {
      id: 'sales',
      label: 'Sales History',
      urduLabel: 'سیل ریکارڈ',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'customers',
      label: 'Customers',
      urduLabel: 'کسٹمرز',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      urduLabel: 'سپلائرز',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'stock',
      label: 'Stock Manager',
      urduLabel: 'اسٹاک جائزہ',
      icon: <PackageSearch className="w-4 h-4" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'expiry',
      label: 'Expiry Alerts',
      urduLabel: 'ایکسپائری',
      icon: <CalendarX className="w-4 h-4" />,
      badge: expiredCount > 0 ? expiredCount : undefined,
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'expenses',
      label: 'Expenses',
      urduLabel: 'اخراجات',
      icon: <WalletCards className="w-4 h-4" />,
    },
    {
      id: 'profit',
      label: 'Profit Analysis',
      urduLabel: 'منافع',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: 'Reports & Export',
      urduLabel: 'رپورٹس',
      icon: <FileBarChart2 className="w-4 h-4" />,
    },
    {
      id: 'backup',
      label: 'Backup & Restore',
      urduLabel: 'بیک اپ',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      urduLabel: 'ترتیبات',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleSelect = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`no-print fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Mini Brand for mobile */}
        <div className="p-4 border-b border-slate-800 lg:hidden flex items-center justify-between">
          <div className="font-bold text-white text-base">SHER MEDICAL STORE</div>
          <button
            onClick={onCloseMobile}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Store Navigation
          </div>

          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                        item.badgeColor || (isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-300')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.urduLabel && (
                    <span className="text-[10px] opacity-40 font-normal hidden group-hover:inline">
                      {item.urduLabel}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Quick Logout and System Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>15. Logout System</span>
          </button>
          <div className="mt-2 px-3 text-[10px] text-slate-400 flex justify-between items-center">
            <span>Offline Local Edition</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
