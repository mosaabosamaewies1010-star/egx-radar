/**
 * Tests for AppNav — search, lang toggle, regime pill.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppNav } from '@/components/AppNav';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}));

// Mock zustand store with controllable state
const mockSetLang = jest.fn();
const mockStore = {
  lang:            'ar' as 'ar' | 'en',
  setLang:         mockSetLang,
  regime:          'SIDEWAYS' as 'SIDEWAYS' | 'BULL' | 'BEAR' | 'VOLATILE' | 'LOW_LIQUIDITY',
  regimeData:      null,
  shariaFilter:    false,
  setShariaFilter: jest.fn(),
  setRegime:       jest.fn(),
  user:            null as null,
  token:           null as null,
  setUser:         jest.fn(),
  setToken:        jest.fn(),
  logout:          jest.fn(),
  initAuth:        jest.fn(),
};
jest.mock('@/lib/store', () => ({
  useAppStore: () => mockStore,
}));

beforeEach(() => {
  mockPush.mockReset();
  mockSetLang.mockReset();
  mockStore.lang = 'ar';
  mockStore.regime = 'SIDEWAYS';
});

describe('AppNav', () => {
  it('renders the EGX Radar logo', () => {
    render(<AppNav />);
    expect(screen.getByText('EGX Radar')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<AppNav />);
    expect(screen.getByPlaceholderText(/ابحث/)).toBeInTheDocument();
  });

  it('navigates to stock page on search submit', async () => {
    const user = userEvent.setup();
    render(<AppNav />);
    const input = screen.getByPlaceholderText(/ابحث/);
    await user.type(input, 'comi');
    await user.keyboard('{Enter}');
    expect(mockPush).toHaveBeenCalledWith('/stocks/COMI');
  });

  it('uppercases the symbol before navigation', async () => {
    const user = userEvent.setup();
    render(<AppNav />);
    await user.type(screen.getByPlaceholderText(/ابحث/), 'efih');
    await user.keyboard('{Enter}');
    expect(mockPush).toHaveBeenCalledWith('/stocks/EFIH');
  });

  it('does not navigate on empty search', async () => {
    const user = userEvent.setup();
    render(<AppNav />);
    await user.keyboard('{Enter}');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows lang toggle button', () => {
    render(<AppNav />);
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('calls setLang when lang toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<AppNav />);
    await user.click(screen.getByText('EN'));
    expect(mockSetLang).toHaveBeenCalledWith('en');
  });

  it('shows regime pill for SIDEWAYS', () => {
    render(<AppNav />);
    expect(screen.getByText(/متذبذب/)).toBeInTheDocument();
  });

  it('shows "سوق صاعد" for BULL regime', () => {
    mockStore.regime = 'BULL';
    render(<AppNav />);
    expect(screen.getByText(/صاعد/)).toBeInTheDocument();
  });

  it('shows PRO badge', () => {
    render(<AppNav />);
    expect(screen.getByText('PRO')).toBeInTheDocument();
  });
});
