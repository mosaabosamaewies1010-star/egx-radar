/**
 * Position Sizing Engine — client-side mirror of backend position_sizing.py
 *
 * Computes shares/position/risk instantly without an API round-trip.
 * Formula: shares = floor((portfolio × finalRiskPct / 100) / (entry - sl))
 */

export interface SizingResult {
  shares:          number;
  positionEgp:     number;
  positionPct:     number;
  riskEgp:         number;
  finalRiskPct:    number;
  potentialGain:   number | null;
  warning:         string | null;
}

const BASE_RISK: Record<string, number> = {
  STAGE_STRONG:    2.0,
  STAGE_DEVELOPING: 1.5,
  'TREND_A+':      1.5,
  TREND_A:         1.0,
  VOL_RADAR:       0.0,
};

const REGIME_MOD: Record<string, number> = {
  BULL:          1.00,
  SIDEWAYS:      0.75,
  VOLATILE:      0.50,
  LOW_LIQUIDITY: 0.50,
  BEAR:          0.25,
};

const MAX_POS_PCT = 25;
const MIN_POS_EGP = 1_000;

export function computePositionSize(
  oppType:     string,
  confidence:  number,
  regime:      string,
  entry:       number,
  sl:          number,
  portfolioEgp: number,
  tp1?:        number | null,
): SizingResult | null {
  const baseRisk = BASE_RISK[oppType] ?? 0;
  if (baseRisk === 0) return null;          // VOL_RADAR — never size

  const riskPerShare = entry - sl;
  if (riskPerShare <= 0) return null;       // invalid SL

  const confMod =
    confidence >= 80 ? 1.00 :
    confidence >= 60 ? 0.75 :
    confidence >= 40 ? 0.50 : 0.25;

  const regimeMod    = REGIME_MOD[regime] ?? 0.75;
  const finalRiskPct = baseRisk * confMod * regimeMod;
  const riskEgp      = portfolioEgp * finalRiskPct / 100;
  let   shares       = Math.floor(riskEgp / riskPerShare);
  let   warning: string | null = null;

  if (shares < 1) {
    return {
      shares: 0, positionEgp: 0, positionPct: 0,
      riskEgp: 0, finalRiskPct,
      potentialGain: null,
      warning: 'محفظة صغيرة أو سعر السهم مرتفع',
    };
  }

  let positionEgp = shares * entry;
  let positionPct = (positionEgp / portfolioEgp) * 100;

  if (positionPct > MAX_POS_PCT) {
    shares      = Math.floor((portfolioEgp * MAX_POS_PCT) / 100 / entry);
    positionEgp = shares * entry;
    positionPct = (positionEgp / portfolioEgp) * 100;
    warning     = `مقيّد ${MAX_POS_PCT}٪`;
  }

  if (positionEgp < MIN_POS_EGP) {
    warning = `أقل من الحد الأدنى (${MIN_POS_EGP.toLocaleString('ar-EG')} ج.م)`;
  }

  const potentialGain = tp1 && tp1 > entry ? shares * (tp1 - entry) : null;

  return {
    shares,
    positionEgp:   Math.round(positionEgp),
    positionPct:   Math.round(positionPct * 10) / 10,
    riskEgp:       Math.round(shares * riskPerShare),
    finalRiskPct:  Math.round(finalRiskPct * 100) / 100,
    potentialGain: potentialGain != null ? Math.round(potentialGain) : null,
    warning,
  };
}
