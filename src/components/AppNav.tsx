'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, LogOut, User, LayoutDashboard, Menu, X, Crown } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Badge } from '@/design-system';

const NAV_LINKS = [
  { href: '/dashboard',      label: 'السوق' },
  { href: '/',               label: 'الفرص' },
  { href: '/discover',       label: 'اكتشف' },
  { href: '/morning-brief',  label: 'موجز صباحي' },
  { href: '/my-day',         label: 'يومي' },
  { href: '/portfolio',      label: 'محفظتي' },
  { href: '/watchlist',      label: 'متابعة' },
  { href: '/performance',    label: 'سجل الأداء' },
  { href: '/notifications',  label: 'إشعارات' },
];

export function AppNav() {
  const { lang, setLang, regime, user, logout, initAuth } = useAppStore();
  const router   = useRouter();
  const pathname = usePathname();
  const [query,      setQuery]      = useState('');
  const [menuOpen,   setMenuOpen]   = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { initAuth?.(); }, [initAuth]);

  // Close drawer on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = query.trim().toUpperCase();
    if (sym) { router.push(`/stocks/${sym}`); setQuery(''); }
  };

  const regimeBg: Record<string, string> = {
    BULL: 'rgba(22,163,74,0.12)', BEAR: 'rgba(220,38,38,0.12)',
    VOLATILE: 'rgba(168,85,247,0.12)', LOW_LIQUIDITY: 'rgba(107,114,128,0.12)',
    SIDEWAYS: 'rgba(217,119,6,0.12)',
  };

  const regimeLabel: Record<string, string> = {
    BULL: 'سوق صاعد', BEAR: 'سوق هابط', VOLATILE: 'تقلبات عالية',
    LOW_LIQUIDITY: 'سيولة منخفضة', SIDEWAYS: 'سوق متذبذب',
  };

  const isAdmin = user?.email?.toLowerCase() === 'mosaab.osama.ewies1010@gmail.com';

  return (
    <>
      <header
        className="sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center gap-3"
        style={{
          background: 'rgba(8,13,24,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
          >
            R
          </div>
          <span className="hidden xs:block font-bold" style={{ fontSize: 'var(--text-lg)' }}>
            EGX Radar
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ color: pathname === href ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            >
              {label}
            </Link>
          ))}
          {!user?.is_pro && (
            <Link
              href="/payments"
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              PRO ⭐
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <LayoutDashboard size={11} />
              Admin
            </Link>
          )}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-xs">
          <div className="relative">
            <Search
              size={14}
              className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)', right: '10px' }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث... (COMI)"
              className="w-full rounded-lg py-2 text-sm outline-none"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                paddingRight: '34px',
                paddingLeft: '10px',
              }}
              onFocus={(e)  => (e.target.style.borderColor = 'var(--border-focus)')}
              onBlur={(e)   => (e.target.style.borderColor = 'var(--border-default)')}
            />
          </div>
        </form>

        {/* Regime pill — hidden on xs */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0"
          style={{ background: regimeBg[regime] ?? regimeBg.SIDEWAYS, color: 'var(--text-secondary)' }}
        >
          <span className="live-pulse w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: 'var(--regime-accent, var(--accent-primary))' }} />
          {regimeLabel[regime] ?? 'سوق متذبذب'}
        </div>

        {/* Spacer */}
        <div className="flex-1 hidden md:block" />

        {/* Lang toggle */}
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="hidden sm:block px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          {lang === 'ar' ? 'EN' : 'عربي'}
        </button>

        {/* Auth — always visible */}
        {user ? (
          <div className="flex items-center gap-1.5 shrink-0">
            {user.is_pro && <Badge variant="pro">PRO</Badge>}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <User size={13} />
              <span className="max-w-[80px] truncate">{user.name ?? user.email.split('@')[0]}</span>
            </div>
            <button
              onClick={() => { logout?.(); router.push('/login'); }}
              className="p-1.5 rounded-lg"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              aria-label="خروج"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/payments"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold md:hidden"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <Crown size={12} />
              PRO
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              دخول
            </Link>
          </div>
        )}

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-1.5 rounded-lg shrink-0"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
          aria-label="القائمة"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div
            ref={drawerRef}
            className="absolute top-[57px] right-0 left-0 py-2 shadow-2xl"
            style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center px-6 py-3.5 text-sm font-medium transition-colors"
                style={{
                  color: pathname === href ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: pathname === href ? 'var(--bg-elevated)' : 'transparent',
                }}
              >
                {label}
              </Link>
            ))}

            {!user?.is_pro && (
              <Link
                href="/payments"
                className="flex items-center gap-2 mx-4 my-2 px-4 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                <Crown size={16} />
                ترقية إلى PRO ⭐
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 mx-4 mb-2 px-4 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <LayoutDashboard size={15} />
                Admin
              </Link>
            )}

            {/* Lang toggle inside drawer */}
            <div className="flex items-center gap-3 px-6 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>اللغة</span>
              <button
                onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setMenuOpen(false); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
              >
                {lang === 'ar' ? 'English' : 'عربي'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
