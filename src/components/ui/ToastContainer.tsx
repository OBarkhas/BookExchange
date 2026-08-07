"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

let toastListeners: Array<(toast: Toast) => void> = [];
let toastIdCounter = 0;

export function showToast(message: string, type: ToastType = "success") {
  const toast: Toast = {
    id: `toast-${++toastIdCounter}`,
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(toast));
}

const typeStyles: Record<
  ToastType,
  { box: string; icon: string; iconBg: string; Icon: typeof Check }
> = {
  success: {
    box: "border-amber-200/80 bg-amber-50/95 text-amber-900",
    icon: "text-amber-600",
    iconBg: "bg-amber-100",
    Icon: Check,
  },
  error: {
    box: "border-rose-200/80 bg-rose-50/95 text-rose-800",
    icon: "text-rose-600",
    iconBg: "bg-rose-100",
    Icon: AlertCircle,
  },
  info: {
    box: "border-stone-200/80 bg-white/95 text-stone-800",
    icon: "text-amber-600",
    iconBg: "bg-amber-100",
    Icon: Info,
  },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);

    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (toast: Toast) => {
      setToasts((prev) => [...prev, { ...toast, exiting: false }]);

      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, 4000);
      timersRef.current.set(toast.id, timer);
    },
    [removeToast],
  );

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== addToast);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => {
        const { box, icon, iconBg, Icon } = typeStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-amber-900/5 backdrop-blur-md ${box} ${
              toast.exiting ? "toast-exit" : "toast-enter"
            }`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconBg}`}
            >
              <Icon className={`h-3.5 w-3.5 ${icon}`} />
            </div>
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-lg opacity-50 transition-all duration-150 hover:bg-stone-200/60 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
