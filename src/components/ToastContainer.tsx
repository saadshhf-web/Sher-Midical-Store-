import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="no-print fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        let bg = 'bg-slate-900 text-white border-slate-800';
        let icon = <Info className="w-4 h-4 text-sky-400 shrink-0" />;

        if (t.type === 'success') {
          bg = 'bg-emerald-900/95 text-white border-emerald-700';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
        } else if (t.type === 'error') {
          bg = 'bg-rose-950/95 text-white border-rose-800';
          icon = <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
        } else if (t.type === 'warning') {
          bg = 'bg-amber-950/95 text-white border-amber-800';
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-xl border backdrop-blur-xs text-xs font-semibold animate-in slide-in-from-bottom-2 duration-150 ${bg}`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span className="leading-tight">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/60 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
