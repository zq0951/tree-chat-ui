'use client';

import { useConfirmStore } from '@/store/useConfirmStore';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog() {
  const { isOpen, title, message, confirmText, cancelText, onConfirm, onCancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors shadow-lg shadow-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
