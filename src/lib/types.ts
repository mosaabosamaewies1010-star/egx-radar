/** Shared TypeScript types — mirrors Flask API response shapes */

export type RegimeType = 'BULL' | 'SIDEWAYS' | 'BEAR' | 'VOLATILE' | 'LOW_LIQUIDITY';
export type DataQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'NO_DATA';
export type SignalQuality = 'HIGH' | 'MEDIUM' | 'LOW';
export type OppType = 'Breakout' | 'Momentum' | 'Swing' | 'Sharia' | 'SRA_A+' | 'SRA_A' | 'SRA_B';
export type SRAGrade = 'A+' | 'A' | 'B';
export type OBVTrend = 'UP' | 'DOWN' | 'FLAT';

export interface ScoreBreakdown {
  trend:       number;
  momentum:    number;
  liquidity:   number;
  volume:      number;
  sector:      number;
  fundamental: number;
  risk_penalty:      number;
  regime_multiplier: number;
}

export interface StockIndicators {
  adx:       number;
  rsi:       number;
  atr_pct:   number;
  rvol:      number;
  obv_trend: OBVTrend;
}

export interface OpportunityLevels {
  entry: number;
  tp1:   number;
  tp2:   number;
  sl:    number;
  rr:    number | null;
  max_hold_days: number;
}

export interface Opportunity {
  id?:            number;
  type:           OppType;
  radar_score:    number;
  signal_quality: SignalQuality;
  run_date?:      string;
  levels:         OpportunityLevels;
  reason?:        { ar: string; en: string };
  outcome?:       string;
}

export interface SRAExitProfile {
  tp:       number;
  sl:       number;
  max_bars: number;
  tp_pct?:  number;
}

export interface SRAOpportunity {
  id:               number;
  type:             OppType;
  run_date:         string;
  score:            number;
  grade:            SRAGrade;
  rvol_spike:       number;
  rsi_at_low:       number;
  regime:           string;
  market_breadth:   number;
  signals:          string[];
  strategy_version: string;
  entry:            number;
  pro_required:     boolean;
  // PRO-only fields (null for free users)
  sl:               number | null;
  similar_cases:    number | null;
  win_rate:         number | null;
  avg_return:       number | null;
  median_return:    number | null;
  best_case:        number | null;
  worst_case:       number | null;
  kb_confidence:    'high' | 'medium' | 'low' | 'none' | null;
  exit_profiles:    { FAST: SRAExitProfile; BALANCED: SRAExitProfile; } | null;
}

export interface StockData {
  symbol:      string;
  name_ar:     string;
  name_en:     string;
  sector:      string;
  is_sharia:   boolean;
  score:       number;
  run_date:    string;
  breakdown:   ScoreBreakdown;
  indicators:  StockIndicators;
  explain:     { ar: string; en: string };
  data_quality: DataQuality;
  opportunity:  Opportunity | null;
  sra_opportunity: SRAOpportunity | null;
  // price snapshot (from last fetch — may be present)
  price?:       number;
  change_amt?:  number;
  change_pct?:  number;
}

export interface MarketRegime {
  regime:     RegimeType;
  confidence: number;
  run_date?:  string;
  breadth?: {
    advancing: number;
    declining: number;
    unchanged: number;
  };
  scores?: {
    ma:         number;
    breadth:    number;
    adx:        number;
    volatility: number;
    volume:     number;
  };
  egx30?: {
    close: number;
    ma20:  number;
    ma50:  number;
    ma200: number;
  };
  reason: { ar: string; en: string };
}

export interface OpportunityListItem {
  id:             number;
  symbol:         string;
  name_ar:        string;
  is_sharia:      boolean;
  type:           OppType;
  radar_score:    number;
  signal_quality: SignalQuality;
  run_date:       string;
  levels:         OpportunityLevels;
}

export interface OpportunitiesResponse {
  total:  number;
  limit:  number;
  offset: number;
  items:  OpportunityListItem[];
}

// ── Slice 10: Payments ────────────────────────────────────────────────────────

export interface Plan {
  id:       string;
  name_ar:  string;
  price:    number;
  currency: string;
  period:   'monthly' | 'annual';
  savings:  string | null;
  features: string[];
}

export interface PlansResponse {
  plans:    Plan[];
  features: string[];
}

export interface PaymentRecord {
  id:             number;
  user_id:        number;
  plan:           string;
  amount:         number;
  currency:       string;
  status:         'pending' | 'completed' | 'failed' | 'refunded' | 'rejected';
  provider_ref:   string | null;
  payment_method: string | null;
  has_receipt:    boolean;
  admin_note:     string | null;
  created_at:     string;
  // admin-only fields
  receipt_image?: string | null;
  user_email?:    string | null;
  user_name?:     string | null;
}

export interface SubscribeResponse {
  payment:      PaymentRecord;
  provider_ref: string;
  instructions: string;
}

export interface ConfirmResponse {
  payment: PaymentRecord;
  is_pro:  boolean;
}

export interface PaymentHistoryResponse {
  total: number;
  items: PaymentRecord[];
}

// ── Slice 9: My Day ───────────────────────────────────────────────────────────

export interface MyDayPortfolio {
  open_positions:     number;
  total_invested:     number;
  unrealized_pnl:     number | null;
  unrealized_pnl_pct: number | null;
}

export interface MyDayAlert {
  symbol:        string;
  name_ar:       string;
  alert_type:    'above' | 'below';
  current_price: number;
  alert_price:   number;
}

export interface MyDayOpportunity {
  symbol:      string;
  name_ar:     string;
  opp_type:    string | null;
  radar_score: number;
  run_date:    string;
}

export interface MyDay {
  as_of:                  string;
  is_authenticated:       boolean;
  portfolio:              MyDayPortfolio | null;
  watchlist_count:        number;
  watchlist_alerts:       MyDayAlert[];
  unread_notifications:   number;
  active_opportunities:   MyDayOpportunity[];
}

// ── Slice 8: Morning Brief ────────────────────────────────────────────────────

export interface MorningBriefTopStock {
  symbol:          string;
  name_ar:         string;
  sector:          string | null;
  is_sharia:       boolean;
  score:           number;
  last_change_pct: number | null;
}

export interface MorningBriefTopRvol {
  symbol:  string;
  name_ar: string;
  rvol:    number;
  score:   number;
}

export interface MorningBriefOpportunity {
  symbol:         string;
  name_ar:        string;
  opp_type:       string | null;
  entry_price:    number;
  tp1_price:      number;
  sl_price:       number;
  radar_score:    number;
  signal_quality: string | null;
  run_date:       string;
}

export interface MorningBriefRegime {
  regime:     RegimeType;
  confidence: number;
  run_date:   string;
  reason:     { ar: string; en: string };
}

export interface MorningBrief {
  as_of:               string | null;
  regime:              MorningBriefRegime | null;
  egx30_close:         number | null;
  egx30_change_pct:    number | null;
  breadth:             { advancing: number; declining: number; unchanged: number } | null;
  top_scores:          MorningBriefTopStock[];
  top_rvol:            MorningBriefTopRvol[];
  new_opportunities:   MorningBriefOpportunity[];
  opportunities_count: number;
  scored_count:        number;
}

// ── Slice 7: Discover ─────────────────────────────────────────────────────────

export interface DiscoverItem {
  symbol:          string;
  name_ar:         string;
  sector:          string | null;
  is_sharia:       boolean;
  score:           number;
  run_date:        string;
  data_quality:    string | null;
  last_price:      number | null;
  last_change_pct: number | null;
  rsi:             number | null;
  adx:             number | null;
  rvol:            number | null;
  obv_trend:       string | null;
  has_opportunity: boolean;
  opp_type:        string | null;
}

export interface DiscoverResponse {
  total:   number;
  limit:   number;
  offset:  number;
  sort:    string;
  sectors: string[];
  items:   DiscoverItem[];
}

// ── Slice 6: Notifications ────────────────────────────────────────────────────

export type NotificationType =
  | 'score_change'
  | 'new_opportunity'
  | 'sl_alert'
  | 'tp_reached'
  | 'regime_change'
  | 'morning_brief';

export interface NotificationItem {
  id:         number;
  user_id:    number | null;
  type:       NotificationType;
  title_ar:   string;
  body_ar:    string | null;
  symbol:     string | null;
  is_read:    boolean;
  created_at: string;
}

export interface NotificationsResponse {
  total:  number;
  unread: number;
  limit:  number;
  offset: number;
  items:  NotificationItem[];
}

// ── Slice 5: Watchlist ────────────────────────────────────────────────────────

export interface WatchlistItem {
  id:                 number;
  user_id:            number | null;
  stock_id:           number;
  symbol:             string | null;
  name_ar:            string | null;
  notes:              string | null;
  alert_price_above:  number | null;
  alert_price_below:  number | null;
  last_price:         number | null;
  last_change_pct:    number | null;
  sector:             string | null;
  is_sharia:          boolean;
  created_at:         string;
}

export interface WatchlistResponse {
  items: WatchlistItem[];
  count: number;
}

// ── Slice 4: Portfolio ────────────────────────────────────────────────────────

export interface PortfolioHolding {
  id:                  number;
  user_id:             number | null;
  stock_id:            number;
  symbol:              string | null;
  name_ar:             string | null;
  quantity:            number;
  avg_cost:            number;
  currency:            string;
  cost_basis:          number;
  is_open:             boolean;
  realized_pnl:        number | null;
  current_price:       number | null;
  unrealized_pnl:      number | null;
  unrealized_pnl_pct:  number | null;
  opened_at:           string;
  closed_at:           string | null;
  close_price:         number | null;
  notes:               string | null;
}

export interface PortfolioSummary {
  total_invested:       number;
  open_positions:       number;
  closed_positions:     number;
  total_realized_pnl:   number;
  total_unrealized_pnl: number | null;
}

export interface PortfolioResponse {
  summary:  PortfolioSummary;
  holdings: PortfolioHolding[];
}

// ── Slice 3: Auth ─────────────────────────────────────────────────────────────

export interface User {
  id:                    number;
  email:                 string;
  name:                  string | null;
  is_pro:                boolean;
  referral_code:         string | null;
  discount_credits:      number;
  referred_by_id:        number | null;
  has_referral_discount: boolean;
  created_at:            string;
}

export interface AuthResponse {
  token: string;
  user:  User;
}

// ── Slice 2: Market Dashboard ─────────────────────────────────────────────────

export interface SectorStat {
  sector:    string;
  avg_score: number;
  count:     number;
}

export interface StockSnapshotItem {
  symbol:       string;
  name_ar:      string;
  score:        number;
  rvol?:        number;
  trend_score?: number;
}

export interface HeatmapStock {
  symbol:     string;
  name_ar:    string;
  sector:     string;
  score:      number;
  change_pct: number;
}

export interface MarketSummary {
  as_of:               string | null;
  regime:              MarketRegime | null;
  egx30_close:         number | null;
  egx30_change_pct:    number | null;
  sector_ranking:      SectorStat[];
  top_volume:          StockSnapshotItem[];
  top_breakouts:       StockSnapshotItem[];
  opportunities_count: number;
}

export interface HeatmapResponse {
  stocks: HeatmapStock[];
  as_of:  string | null;
}

// ── Slice 12: Performance / Decision Moat ────────────────────────────────────

export interface PerformanceSlice {
  total:          number;
  closed:         number;
  wins:           number;
  losses:         number;
  win_rate:       number | null;
  avg_win_pct:    number | null;
  avg_loss_pct:   number | null;
  profit_factor:  number | null;
  expectancy:     number | null;
  avg_hold_days:  number | null;
  tp1_rate:       number | null;
  sl_rate:        number | null;
}

export interface PerformanceByYear    extends PerformanceSlice { year:    number }
export interface PerformanceBySector  extends PerformanceSlice { sector:  string }
export interface PerformanceByVersion extends PerformanceSlice { version: string }
export interface PerformanceTopStock  extends PerformanceSlice { symbol: string; name_ar: string; sector: string | null }

export interface PerformanceResponse {
  overall:    PerformanceSlice;
  by_year:    PerformanceByYear[];
  by_sector:  PerformanceBySector[];
  by_version: PerformanceByVersion[];
  top_stocks: PerformanceTopStock[];
}

export interface TradeRecord {
  id:             number;
  symbol:         string;
  name_ar:        string;
  sector:         string | null;
  is_sharia:      boolean;
  opp_type:       string;
  radar_score:    number;
  signal_quality: string | null;
  run_date:       string;
  closed_at:      string | null;
  hold_days:      number | null;
  outcome:        'WIN' | 'LOSS' | 'EXPIRED';
  exit_reason:    string | null;
  pnl_pct:        number | null;
  entry_price:    number;
  exit_price:     number | null;
  tp1_price:      number;
  tp2_price:      number;
  sl_price:       number;
  rr_ratio:       number | null;
  regime:         string | null;
  sra_grade:      string | null;
  sra_score:      number | null;
}

export interface TradeHistoryResponse {
  total:  number;
  limit:  number;
  offset: number;
  trades: TradeRecord[];
}

