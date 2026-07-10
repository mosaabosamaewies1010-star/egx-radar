'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell, BellOff, TrendingUp, AlertTriangle, Target,
  Activity, Newspaper, CheckCheck, Trash2, X,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { NotificationItem, NotificationType } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardBody, ErrorState, WidgetSkeleton } from '@/design-system';

// ── helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<NotificationType, { icon: React.ReactNode; label: string; color: string }> = {
  score_change:    { icon: <TrendingUp   size={14} />, label: 'تغيّر في القوة', color: 'var(--accent-primary)' },
  new_opportunity: { icon: <Target       size={14} />, label: 'فرصة جديدة',          color: '#22c55e' },
  sl_alert:        { icon: <AlertTriangle size={14} />, label: 'تنبيه وقف الخسارة',  color: '#ef4444' },
  tp_reached:      { icon: <Target       size={14} />, label: 'هدف محقق',            color: '#22c55e' },
  regime_change:   { icon: <Activity     size={14} />, label: 'تغيّر المزاج العام',  color: '#a855f7' },
  morning_brief:   { icon: <Newspaper    size={14} />, label: 'النشرة الصباحية',     color: '#f59e0b' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)   return 'الآن';
  if (mins  < 60)  return `منذ ${mins} د`;
  if (hours < 24)  return `منذ ${hours} س`;
  if (days  < 7)   return `منذ ${days} يوم`;
  return new Date(iso).toLocaleDateString('ar-EG');
}

// ── WGT-040: Notification item ────────────────────────────────────────────────

function NotifRow({
  item,
  onRead,
  onDelete,
  deletingId,
}: {
  item: NotificationItem;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
}) {
  const meta = TYPE_META[item.type] ?? TYPE_META.morning_brief;

  return (
    <div
      className="flex items-start gap-3 py-3 border-b border-[var(--border-subtle)] last:border-0 transition-opacity"
      style={{ opacity: item.is_read ? 0.6 : 1 }}
    >
      {/* Type icon */}
      <div
        className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${meta.color}18`, color: meta.color }}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold leading-tight"
            style={{ color: item.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}
          >
            {item.title_ar}
          </span>
          {!item.is_read && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: 'var(--accent-primary)' }}
            />
          )}
        </div>
        {item.body_ar && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {item.body_ar}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {relativeTime(item.created_at)}
          </span>
          {item.symbol && (
            <>
              <span style={{ color: 'var(--border-default)' }}>·</span>
              <Link
                href={`/stocks/${item.symbol}`}
                className="text-[10px] font-medium hover:underline num"
                style={{ color: 'var(--accent-primary)' }}
              >
                {item.symbol}
              </Link>
            </>
          )}
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!item.is_read && (
          <button
            onClick={() => onRead(item.id)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="تحديد كمقروء"
            title="تحديد كمقروء"
          >
            <CheckCheck size={13} />
          </button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          disabled={deletingId === item.id}
          className="p-1.5 rounded-md transition-colors disabled:opacity-40"
          style={{ color: 'var(--text-muted)' }}
          aria-label="حذف"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ── WGT-041: Notification list card ──────────────────────────────────────────

function NotifList({
  items,
  unread,
  onRead,
  onDelete,
  onMarkAll,
  onClearRead,
  deletingId,
  marking,
  clearing,
}: {
  items: NotificationItem[];
  unread: number;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  onMarkAll: () => void;
  onClearRead: () => void;
  deletingId: number | null;
  marking: boolean;
  clearing: boolean;
}) {
  return (
    <Card widgetId="WGT-041" padding="md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>الإشعارات</CardTitle>
          {unread > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={onMarkAll}
              disabled={marking}
              className="text-xs flex items-center gap-1 disabled:opacity-50"
              style={{ color: 'var(--accent-primary)' }}
            >
              <CheckCheck size={12} />
              {marking ? '…' : 'تحديد الكل مقروء'}
            </button>
          )}
          {items.some((n) => n.is_read) && (
            <button
              onClick={onClearRead}
              disabled={clearing}
              className="text-xs flex items-center gap-1 disabled:opacity-50"
              style={{ color: 'var(--text-muted)' }}
            >
              <Trash2 size={12} />
              {clearing ? '…' : 'مسح المقروءة'}
            </button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <BellOff size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              لا توجد إشعارات
            </p>
          </div>
        ) : (
          items.map((item) => (
            <NotifRow
              key={item.id}
              item={item}
              onRead={onRead}
              onDelete={onDelete}
              deletingId={deletingId}
            />
          ))
        )}
      </CardBody>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [items,      setItems]      = useState<NotificationItem[]>([]);
  const [unread,     setUnread]     = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [marking,    setMarking]    = useState(false);
  const [clearing,   setClearing]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getNotifications({ limit: 50 });
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      setError('تعذّر تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRead = async (id: number) => {
    const updated = await api.markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.deleteNotification(id);
      const wasUnread = items.find((n) => n.id === id)?.is_read === false;
      setItems((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnread((u) => Math.max(0, u - 1));
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await api.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } finally {
      setMarking(false);
    }
  };

  const handleClearRead = async () => {
    setClearing(true);
    try {
      await api.clearReadNotifications();
      setItems((prev) => prev.filter((n) => !n.is_read));
    } finally {
      setClearing(false);
    }
  };

  return (
    <main
      className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6"
      style={{ minHeight: '100vh' }}
    >
      <div className="flex items-center gap-3">
        <Bell size={22} style={{ color: 'var(--accent-primary)' }} />
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}
          >
            الإشعارات
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            تنبيهات الأسعار والفرص وتغيّرات السوق
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl overflow-hidden"><WidgetSkeleton rows={6} /></div>
      ) : error ? (
        <ErrorState scenario="network" onRetry={load} />
      ) : (
        <NotifList
          items={items}
          unread={unread}
          onRead={handleRead}
          onDelete={handleDelete}
          onMarkAll={handleMarkAll}
          onClearRead={handleClearRead}
          deletingId={deletingId}
          marking={marking}
          clearing={clearing}
        />
      )}
    </main>
  );
}
