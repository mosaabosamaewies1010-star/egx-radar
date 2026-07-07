'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAppStore } from '@/lib/store';

/** WGT-021 */
export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken, user } = useAppStore();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register(email.trim().toLowerCase(), password, name.trim() || undefined);
      setToken(res.token);
      setUser(res.user);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        let msg: string;
        try { msg = JSON.parse(err.message).error ?? err.message; } catch { msg = err.message; }
        setError(msg);
      } else {
        setError('حدث خطأ في الاتصال، حاول مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        data-widget-id="WGT-021"
        className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-6"
        style={{
          background: 'var(--bg-card)',
          border:     '1px solid var(--border-default)',
        }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
          >
            R
          </div>
          <h1 className="font-bold" style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
            إنشاء حساب
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            انضم إلى رادار البورصة المصرية
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg px-4 py-3 text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name (optional) */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              الاسم <span style={{ color: 'var(--text-muted)' }}>(اختياري)</span>
            </label>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: محمد أحمد"
              className="rounded-lg px-4 py-2.5 text-sm outline-none w-full"
              style={{
                background: 'var(--bg-input)',
                border:     '1px solid var(--border-default)',
                color:      'var(--text-primary)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'var(--border-default)'; }}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="rounded-lg px-4 py-2.5 text-sm outline-none w-full"
              style={{
                background: 'var(--bg-input)',
                border:     '1px solid var(--border-default)',
                color:      'var(--text-primary)',
                direction:  'ltr',
                textAlign:  'right',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'var(--border-default)'; }}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              كلمة المرور{' '}
              <span style={{ color: 'var(--text-muted)' }}>(8 أحرف على الأقل)</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="rounded-lg px-4 py-2.5 text-sm outline-none w-full"
                style={{
                  background:  'var(--bg-input)',
                  border:      '1px solid var(--border-default)',
                  color:       'var(--text-primary)',
                  paddingLeft: '40px',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--border-focus)'; }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--border-default)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
                aria-label={showPw ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold mt-1 transition-opacity disabled:opacity-60"
            style={{ background: 'var(--accent-primary)', color: 'white' }}
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <UserPlus size={16} />
            )}
            {loading ? 'جارٍ إنشاء الحساب…' : 'إنشاء حساب'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          لديك حساب؟{' '}
          <Link href="/login" style={{ color: 'var(--accent-primary)' }}>
            ادخل الآن
          </Link>
        </p>

        <p className="text-center" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          بالتسجيل، أنت توافق على شروط الاستخدام —
          المنصة لأغراض تجريبية فقط
        </p>
      </div>
    </main>
  );
}
