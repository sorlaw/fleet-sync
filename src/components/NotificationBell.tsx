"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean | null;
  createdAt: string | Date;
}

interface Toast {
  id: string;
  title: string;
  body: string | null;
}

function timeAgo(date: string | Date): string {
  const d = new Date(date).getTime();
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const knownIds = useRef<Set<string> | null>(null);
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = toastTimers.current.get(id);
    if (timer) clearTimeout(timer);
    toastTimers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (item: NotificationItem) => {
      const id = item.id;
      setToasts((prev) =>
        prev.some((t) => t.id === id) || prev.length >= 3
          ? prev
          : [...prev, { id, title: item.title, body: item.body }]
      );
      const timer = setTimeout(() => removeToast(id), 5000);
      toastTimers.current.set(id, timer);
    },
    [removeToast]
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();

      // First load: mark all as known without toasting
      if (knownIds.current === null) {
        knownIds.current = new Set(
          data.items.map((i: NotificationItem) => i.id)
        );
      } else {
        for (const item of data.items as NotificationItem[]) {
          if (!knownIds.current.has(item.id)) {
            knownIds.current.add(item.id);
            if (!item.isRead) pushToast(item);
          }
        }
      }

      setItems(data.items);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent — polling error tidak perlu ditampilkan
    }
  }, [pushToast]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchNotifications();
    }, 0);
    const interval = setInterval(fetchNotifications, 20000);
    const timers = toastTimers.current;
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isRead: true } : i))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  return (
    <>
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl p-4 shadow-lg border border-zinc-700 dark:border-zinc-300 animate-in slide-in-from-right"
            role="alert"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{toast.title}</p>
                {toast.body && (
                  <p className="text-xs opacity-75 mt-0.5 line-clamp-2">
                    {toast.body}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Tutup notifikasi"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bell */}
      <div className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="relative p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Notifikasi"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Notifikasi
                </p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Belum ada notifikasi
                  </div>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (!item.isRead) markOneRead(item.id);
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex gap-3 ${
                        !item.isRead
                          ? "bg-blue-50/50 dark:bg-blue-950/20"
                          : ""
                      }`}
                    >
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          item.isRead
                            ? "bg-transparent"
                            : "bg-blue-500"
                        }`}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {item.title}
                        </span>
                        {item.body && (
                          <span className="block text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                            {item.body}
                          </span>
                        )}
                        <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                          {timeAgo(item.createdAt)}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
