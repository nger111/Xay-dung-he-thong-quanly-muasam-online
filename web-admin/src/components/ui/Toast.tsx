import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Toast store (simple event-based)
type ToastListener = (toasts: ToastMessage[]) => void;
let toasts: ToastMessage[] = [];
const listeners: ToastListener[] = [];

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export const toast = {
  show: (type: ToastType, message: string, duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    const t: ToastMessage = { id, type, message, duration };
    toasts = [...toasts, t];
    notify();
    if (duration > 0) {
      setTimeout(() => toast.remove(id), duration);
    }
  },
  success: (msg: string, duration?: number) => toast.show('success', msg, duration),
  error: (msg: string, duration?: number) => toast.show('error', msg, duration),
  warning: (msg: string, duration?: number) => toast.show('warning', msg, duration),
  info: (msg: string, duration?: number) => toast.show('info', msg, duration),
  remove: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  error: <XCircle className="w-5 h-5 text-red-600" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
};

const styles: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-blue-200 bg-blue-50',
};

export const ToastContainer: React.FC = () => {
  const [items, setItems] = useState<ToastMessage[]>([]);

  const update = useCallback((t: ToastMessage[]) => setItems(t), []);

  useEffect(() => {
    listeners.push(update);
    return () => {
      const idx = listeners.indexOf(update);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, [update]);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto animate-in slide-in-from-right-5 duration-300 ${styles[t.type]}`}
        >
          {icons[t.type]}
          <p className="flex-1 text-sm font-medium text-gray-800">{t.message}</p>
          <button
            onClick={() => toast.remove(t.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
