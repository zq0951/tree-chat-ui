'use client';

import { useToastStore, ToastType } from '@/store/useToastStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const toastConfig: Record<ToastType, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    bg: 'bg-emerald-950/90',
    text: 'text-emerald-100',
    border: 'border-emerald-800/50',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
    bg: 'bg-rose-950/90',
    text: 'text-rose-100',
    border: 'border-rose-800/50',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    bg: 'bg-amber-950/90',
    text: 'text-amber-100',
    border: 'border-amber-800/50',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-400" />,
    bg: 'bg-blue-950/90',
    text: 'text-blue-100',
    border: 'border-blue-800/50',
  },
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type] || toastConfig.info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start p-4 rounded-xl border ${config.bg} ${config.border} shadow-2xl backdrop-blur-xl animate-toast-enter`}
            role="alert"
          >
            <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
            <div className={`ml-3 w-0 flex-1 ${config.text}`}>
              <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                type="button"
                className={`inline-flex rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 ${config.text} hover:bg-white/10 transition-colors`}
                onClick={() => removeToast(toast.id)}
              >
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
