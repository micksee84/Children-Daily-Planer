import React, { useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'info' | 'remove' | 'warning';
  onUndo?: () => void;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border-[2.5px] border-[#2D2200] rounded-full px-5 py-2.5 shadow-flat-ink font-['Nunito'] animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <span className="font-extrabold text-[14px] text-[#2D2200]">
        {toast.message}
      </span>

      {toast.onUndo && (
        <button
          type="button"
          onClick={() => {
            toast.onUndo?.();
            onClose();
          }}
          className="px-4 py-1.5 rounded-full bg-[#2D2200] hover:bg-[#2D2200]/90 text-white font-extrabold text-[13px] shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw size={13} strokeWidth={2.5} />
          <span>Undo</span>
        </button>
      )}

      <button
        type="button"
        aria-label="Dismiss message"
        onClick={onClose}
        className="p-1 text-[#2D2200]/60 hover:text-[#2D2200] rounded-full"
      >
        <X size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
};
