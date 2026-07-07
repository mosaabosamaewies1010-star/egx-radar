/**
 * EGX Radar — Design System
 * Single import point for all tokens and components.
 *
 * Usage:
 *   import { Button, Card, Badge } from '@/design-system';
 *   import { getScoreColor, colors }  from '@/design-system';
 */

// Tokens
export * from './tokens';

// UI Primitives  (UI-XXX)
export * from './components/Button';
export * from './components/Card';
export * from './components/Badge';
export * from './components/Input';
export * from './components/Modal';
export * from './components/Toast';
export * from './components/Skeleton';
export * from './components/Tabs';
export * from './components/Tooltip';
export * from './components/EmptyState';
export * from './components/ErrorState';
export * from './components/ProGate';
export * from './components/ScoreGauge';
export * from './components/StarsRating';
export * from './components/MetricCard';
export * from './components/Sparkline';
export * from './components/ProgressBar';
export * from './components/LangToggle';

// Financial Domain Components (unique to EGX Radar)
export * from './components/Financial';
