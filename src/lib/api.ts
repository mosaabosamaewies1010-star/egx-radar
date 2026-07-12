/**
 * EGX Radar API Client
 * Typed wrappers for the Flask backend at localhost:5001
 */
import type { StockData, MarketRegime, OpportunitiesResponse, MarketSummary, HeatmapResponse, User, AuthResponse, PortfolioResponse, PortfolioHolding, WatchlistResponse, WatchlistItem, NotificationsResponse, NotificationItem, DiscoverResponse, MorningBrief, MyDay, PlansResponse, SubscribeResponse, ConfirmResponse, PaymentHistoryResponse, PerformanceResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('egx_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body || res.statusText);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  /** Fetch Radar Score + indicators + explain + opportunity for a stock */
  getStock(symbol: string): Promise<StockData> {
    return apiFetch<StockData>(`/api/stocks/${encodeURIComponent(symbol.toUpperCase())}`);
  },

  /** Current market regime */
  getRegime(): Promise<MarketRegime> {
    return apiFetch<MarketRegime>('/api/market/regime');
  },

  /** Active opportunities list */
  getOpportunities(opts?: {
    limit?: number;
    offset?: number;
    sharia?: boolean;
  }): Promise<OpportunitiesResponse> {
    const params = new URLSearchParams();
    if (opts?.limit)  params.set('limit',  String(opts.limit));
    if (opts?.offset) params.set('offset', String(opts.offset));
    if (opts?.sharia) params.set('sharia', '1');
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<OpportunitiesResponse>(`/api/opportunities${qs}`);
  },

  /** Update opportunity outcome (WIN/LOSS/EXPIRED) */
  updateOutcome(id: number, outcome: string, exitPrice?: number): Promise<unknown> {
    return apiFetch(`/api/opportunities/${id}/outcome`, {
      method: 'PATCH',
      body: JSON.stringify({ outcome, exit_price: exitPrice }),
    });
  },

  /** Health check */
  health(): Promise<{ status: string }> {
    return apiFetch('/health');
  },

  /** Full market snapshot (regime + EGX30 + sector ranking + top stocks) */
  getMarketSummary(): Promise<MarketSummary> {
    return apiFetch<MarketSummary>('/api/market/summary');
  },

  /** All scored stocks for the visual heatmap */
  getHeatmap(): Promise<HeatmapResponse> {
    return apiFetch<HeatmapResponse>('/api/market/heatmap');
  },

  // ── Auth ──────────────────────────────────────────────────────────────────

  /** Register a new account — returns JWT + user profile */
  register(email: string, password: string, name?: string, ref?: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, ref }),
    });
  },

  /** Log in with email + password — returns JWT + user profile */
  login(email: string, password: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /** Fetch current user profile (requires valid JWT in localStorage) */
  getMe(): Promise<User> {
    return apiFetch<User>('/api/auth/me');
  },

  // ── Portfolio ─────────────────────────────────────────────────────────────

  /** List all holdings + portfolio summary */
  getPortfolio(): Promise<PortfolioResponse> {
    return apiFetch<PortfolioResponse>('/api/portfolio');
  },

  /** Add a new open position */
  addHolding(data: { symbol: string; quantity: number; avg_cost: number; notes?: string }): Promise<PortfolioHolding> {
    return apiFetch<PortfolioHolding>('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Close an open position at a given exit price */
  closeHolding(id: number, closePrice: number): Promise<PortfolioHolding> {
    return apiFetch<PortfolioHolding>(`/api/portfolio/${id}/close`, {
      method: 'PATCH',
      body: JSON.stringify({ close_price: closePrice }),
    });
  },

  /** Delete a holding permanently */
  deleteHolding(id: number): Promise<void> {
    return apiFetch<void>(`/api/portfolio/${id}`, { method: 'DELETE' });
  },

  // ── Watchlist ─────────────────────────────────────────────────────────────

  /** List all watchlist items */
  getWatchlist(): Promise<WatchlistResponse> {
    return apiFetch<WatchlistResponse>('/api/watchlist');
  },

  /** Add a stock to the watchlist */
  addToWatchlist(data: { symbol: string; notes?: string; alert_price_above?: number; alert_price_below?: number }): Promise<WatchlistItem> {
    return apiFetch<WatchlistItem>('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Update notes / alert prices on a watchlist entry */
  updateWatchlistItem(id: number, data: { notes?: string; alert_price_above?: number | null; alert_price_below?: number | null }): Promise<WatchlistItem> {
    return apiFetch<WatchlistItem>(`/api/watchlist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /** Remove a stock from the watchlist */
  removeFromWatchlist(id: number): Promise<void> {
    return apiFetch<void>(`/api/watchlist/${id}`, { method: 'DELETE' });
  },

  // ── Notifications ─────────────────────────────────────────────────────────

  /** List notifications — optionally filter to unread only */
  getNotifications(opts?: { unread?: boolean; limit?: number; offset?: number }): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (opts?.unread)  params.set('unread', '1');
    if (opts?.limit)   params.set('limit',  String(opts.limit));
    if (opts?.offset)  params.set('offset', String(opts.offset));
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<NotificationsResponse>(`/api/notifications${qs}`);
  },

  /** Mark a single notification as read */
  markNotificationRead(id: number): Promise<NotificationItem> {
    return apiFetch<NotificationItem>(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  /** Mark all notifications as read */
  markAllNotificationsRead(): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>('/api/notifications/read-all', { method: 'PATCH' });
  },

  /** Delete a single notification */
  deleteNotification(id: number): Promise<void> {
    return apiFetch<void>(`/api/notifications/${id}`, { method: 'DELETE' });
  },

  /** Delete all read notifications */
  clearReadNotifications(): Promise<{ ok: boolean }> {
    return apiFetch<{ ok: boolean }>('/api/notifications', { method: 'DELETE' });
  },

  // ── Payments ──────────────────────────────────────────────────────────────

  /** Public list of subscription plans */
  getPlans(): Promise<PlansResponse> {
    return apiFetch<PlansResponse>('/api/payments/plans');
  },

  /** Create a pending payment for the chosen plan (JWT required) */
  subscribe(plan: 'pro_monthly' | 'pro_annual'): Promise<SubscribeResponse> {
    return apiFetch<SubscribeResponse>('/api/payments/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  },

  /** User's payment history (JWT required) */
  getPaymentHistory(): Promise<PaymentHistoryResponse> {
    return apiFetch<PaymentHistoryResponse>('/api/payments/history');
  },

  /** Confirm a pending payment — activates PRO (JWT required) */
  confirmPayment(id: number): Promise<ConfirmResponse> {
    return apiFetch<ConfirmResponse>(`/api/payments/${id}/confirm`, { method: 'PATCH' });
  },

  // ── My Day ────────────────────────────────────────────────────────────────

  /** Personalised daily summary — portfolio health, watchlist alerts, notifications */
  getMyDay(): Promise<MyDay> {
    return apiFetch<MyDay>('/api/my-day');
  },

  // ── Morning Brief ─────────────────────────────────────────────────────────

  /** Daily market brief — regime, top stocks, new opportunities */
  getMorningBrief(): Promise<MorningBrief> {
    return apiFetch<MorningBrief>('/api/morning-brief');
  },

  // ── Performance ───────────────────────────────────────────────────────────

  /** Historical performance stats — win rate, profit factor, by year/sector/version */
  getPerformance(): Promise<PerformanceResponse> {
    return apiFetch<PerformanceResponse>('/api/performance');
  },

  // ── Discover ──────────────────────────────────────────────────────────────

  /** Stock screener — ranked by Radar Score with optional filters */
  discover(opts?: {
    sector?:    string;
    sharia?:    boolean;
    min_score?: number;
    max_score?: number;
    opp_only?:  boolean;
    sort?:      'score' | 'rvol' | 'rsi' | 'change_pct';
    limit?:     number;
    offset?:    number;
  }): Promise<DiscoverResponse> {
    const params = new URLSearchParams();
    if (opts?.sector)              params.set('sector',    opts.sector);
    if (opts?.sharia)              params.set('sharia',    '1');
    if (opts?.min_score != null)   params.set('min_score', String(opts.min_score));
    if (opts?.max_score != null)   params.set('max_score', String(opts.max_score));
    if (opts?.opp_only)            params.set('opp_only',  '1');
    if (opts?.sort)                params.set('sort',      opts.sort);
    if (opts?.limit)               params.set('limit',     String(opts.limit));
    if (opts?.offset)              params.set('offset',    String(opts.offset));
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<DiscoverResponse>(`/api/discover${qs}`);
  },
};
