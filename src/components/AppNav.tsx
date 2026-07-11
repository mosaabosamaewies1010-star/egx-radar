'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/design-system';

export function AppNav() {
  const { lang, setLang, regime, user, logout, initAuth } = useAppStore();
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Restore auth from localStorage on first render
  useEffect(() => { initAuth?.(); }, [initAuth]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = query.trim().toUpperCase();
    if (sym) router.push(`/stocks/${sym}`);
  };

  const regimeBg: Record<string, string> = {
    BULL: 'rgba(22,163,74,0.12)', BEAR: 'rgba(220,38,38,0.12)',
    VOLATILE: 'rgba(168,85,247,0.12)', LOW_LIQUIDITY: 'rgba(107,114,128,0.12)',
    SIDEWAYS: 'rgba(217,119,6,0.12)',
  };

  return (
    <header
      className="sticky top-0 z-50 px-6 py-3 flex items-center gap-4"
      style={{
        background: 'rgba(8,13,24,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
          style={{ background: 'var(--accent-primary)', color: 'white' }}
        >
          R
        </div>
        <span className="font-bold" style={{ fontSize: 'var(--text-lg)' }}>
          EGX Radar
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1">
        <Link
          href="/dashboard"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar' ? 'السوق' : 'Market'}
        </Link>
        <Link
          href="/"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar' ? 'الفرص' : 'Opportunities'}
        </Link>
        <Link
          href="/portfolio"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar' ? 'محفظتي' : 'Portfolio'}
        </Link>
        <Link
          href="/watchlist"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar' ? 'متابعة' : 'Watchlist'}
        </Link>
        <Link
          href="/discover"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar' ? 'اكتشف' : 'Discover'}
        </Link>
        <Link
          href="/morning-brief"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar' ? 'موجز' : 'Brief'}
        </Link>
        <Link
          href="/my-day"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar' ? 'يومي' : 'My Day'}
        </Link>
        {!user?.is_pro && (
          <Link
            href="/payments"
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            {lang === 'ar' ? 'PRO ⭐' : 'PRO ⭐'}
          </Link>
        )}
        <Link
          href="/performance"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar' ? 'سجل الأداء' : 'Track Record'}
        </Link>
        <Link
          href="/notifications"
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar' ? 'إشعارات' : 'Alerts'}
        </Link>
        {user?.email?.toLowerCase() === 'mosaab.osama.ewies1010@gmail.com' && (
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <LayoutDashboard size={11} />
            Admin
          </Link>
        )}
      </nav>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xs">
        <div className="relative">
          <Search
            size={15}
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              color: 'var(--text-muted)',
              [lang === 'ar' ? 'right' : 'left']: '10px',
            }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن سهم... (COMI)"
            className="w-full rounded-lg py-2 text-sm outline-none transition-colors"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              paddingRight: lang === 'ar' ? '34px' : '12px',
              paddingLeft:  lang === 'ar' ? '12px' : '34px',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--border-focus)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-default)';
            }}
          />
        </div>
      </form>

      {/* Regime pill */}
      <div
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ background: regimeBg[regime] ?? regimeBg.SIDEWAYS, color: 'var(--text-secondary)' }}
      >
        <span className="live-pulse w-1.5 h-1.5 rounded-full inline-block"
          style={{ background: 'var(--regime-accent, var(--accent-primary))' }} />
        {regime === 'BULL' ? 'سوق صاعد' :
         regime === 'BEAR' ? 'سوق هابط' :
         regime === 'VOLATILE' ? 'تقلبات عالية' :
         regime === 'LOW_LIQUIDITY' ? 'سيولة منخفضة' : 'سوق متذبذب'}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Lang toggle */}
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        {lang === 'ar' ? 'EN' : 'عربي'}
      </button>

      {/* Auth area */}
      {user ? (
        <div className="hidden sm:flex items-center gap-2">
          {user.is_pro && <Badge variant="pro">PRO</Badge>}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <User size={13} />
            <span className="max-w-[80px] truncate">{user.name ?? user.email.split('@')[0]}</span>
          </div>
          <button
            onClick={() => { logout?.(); router.push('/login'); }}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            aria-label="خروج"
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="pro">PRO</Badge>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
          >
            دخول
          </Link>
        </div>
      )}
    </header>
  );
}
