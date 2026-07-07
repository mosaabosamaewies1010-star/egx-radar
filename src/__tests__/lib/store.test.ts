/**
 * Tests for the Zustand app store.
 */
import { act } from 'react';
import { useAppStore } from '@/lib/store';
import type { MarketRegime } from '@/lib/types';

// Reset store between tests
beforeEach(() => {
  useAppStore.setState({
    lang: 'ar',
    regime: 'SIDEWAYS',
    regimeData: null,
    shariaFilter: false,
  });
});

describe('useAppStore — lang', () => {
  it('defaults to ar', () => {
    expect(useAppStore.getState().lang).toBe('ar');
  });

  it('setLang switches to en', () => {
    act(() => useAppStore.getState().setLang('en'));
    expect(useAppStore.getState().lang).toBe('en');
  });

  it('setLang switches back to ar', () => {
    act(() => {
      useAppStore.getState().setLang('en');
      useAppStore.getState().setLang('ar');
    });
    expect(useAppStore.getState().lang).toBe('ar');
  });
});

describe('useAppStore — regime', () => {
  it('defaults to SIDEWAYS', () => {
    expect(useAppStore.getState().regime).toBe('SIDEWAYS');
  });

  it('setRegime updates regime and regimeData', () => {
    const mockRegime: MarketRegime = {
      regime: 'BULL',
      confidence: 80,
      reason: { ar: 'سوق صاعد', en: 'Bull market' },
    };
    act(() => useAppStore.getState().setRegime(mockRegime));
    expect(useAppStore.getState().regime).toBe('BULL');
    expect(useAppStore.getState().regimeData).toEqual(mockRegime);
  });

  it('setRegime handles BEAR regime', () => {
    const regime: MarketRegime = {
      regime: 'BEAR',
      confidence: 65,
      reason: { ar: 'سوق هابط', en: 'Bear market' },
    };
    act(() => useAppStore.getState().setRegime(regime));
    expect(useAppStore.getState().regime).toBe('BEAR');
  });
});

describe('useAppStore — shariaFilter', () => {
  it('defaults to false', () => {
    expect(useAppStore.getState().shariaFilter).toBe(false);
  });

  it('setShariaFilter enables filter', () => {
    act(() => useAppStore.getState().setShariaFilter(true));
    expect(useAppStore.getState().shariaFilter).toBe(true);
  });

  it('setShariaFilter toggles back to false', () => {
    act(() => {
      useAppStore.getState().setShariaFilter(true);
      useAppStore.getState().setShariaFilter(false);
    });
    expect(useAppStore.getState().shariaFilter).toBe(false);
  });
});
