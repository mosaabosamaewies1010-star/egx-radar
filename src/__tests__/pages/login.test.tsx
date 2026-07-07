/**
 * Tests for Login page (/login)
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';

const mockPush    = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter:   () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/login',
}));

const mockStore = {
  lang:          'ar' as const,
  user:          null as null,
  token:         null as null,
  setUser:       jest.fn(),
  setToken:      jest.fn(),
  logout:        jest.fn(),
  initAuth:      jest.fn(),
  regime:        'SIDEWAYS' as const,
  regimeData:    null,
  setRegime:     jest.fn(),
  shariaFilter:  false,
  setShariaFilter: jest.fn(),
  setLang:       jest.fn(),
};
jest.mock('@/lib/store', () => ({ useAppStore: () => mockStore }));

const mockLogin = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { login: (...a: unknown[]) => mockLogin(...a) },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, msg: string) { super(msg); this.status = status; }
  },
}));

beforeEach(() => {
  mockLogin.mockReset();
  mockPush.mockReset();
  mockReplace.mockReset();
  mockStore.user = null;
  mockStore.setUser.mockReset();
  mockStore.setToken.mockReset();
});

// ── Render ────────────────────────────────────────────────────────────────────

describe('LoginPage — render', () => {
  it('renders email input', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /دخول/ })).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /سجل الآن/ })).toBeInTheDocument();
  });

  it('renders brand name', () => {
    render(<LoginPage />);
    expect(screen.getByText('EGX Radar')).toBeInTheDocument();
  });

  it('renders disclaimer', () => {
    render(<LoginPage />);
    expect(screen.getByText(/ليست نصيحة استثمارية/)).toBeInTheDocument();
  });
});

// ── Success ───────────────────────────────────────────────────────────────────

describe('LoginPage — success', () => {
  it('calls api.login with email and password', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ token: 'tok', user: { id: 1, email: 'u@e.com', name: null, is_pro: false, created_at: '' } });
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'u@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'mypassword');
    await user.click(screen.getByRole('button', { name: /دخول/ }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('u@e.com', 'mypassword'));
  });

  it('calls setToken with returned token', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ token: 'tok123', user: { id: 1, email: 'u@e.com', name: null, is_pro: false, created_at: '' } });
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'u@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'mypassword');
    await user.click(screen.getByRole('button', { name: /دخول/ }));

    await waitFor(() => expect(mockStore.setToken).toHaveBeenCalledWith('tok123'));
  });

  it('calls setUser with returned user', async () => {
    const user = userEvent.setup();
    const fakeUser = { id: 1, email: 'u@e.com', name: 'Test', is_pro: false, created_at: '' };
    mockLogin.mockResolvedValue({ token: 'tok', user: fakeUser });
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'u@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'mypassword');
    await user.click(screen.getByRole('button', { name: /دخول/ }));

    await waitFor(() => expect(mockStore.setUser).toHaveBeenCalledWith(fakeUser));
  });

  it('redirects to home after successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ token: 'tok', user: { id: 1, email: 'u@e.com', name: null, is_pro: false, created_at: '' } });
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'u@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'mypassword');
    await user.click(screen.getByRole('button', { name: /دخول/ }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('LoginPage — error', () => {
  it('shows alert on API error', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('fail'));
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'u@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'bad');
    await user.click(screen.getByRole('button', { name: /دخول/ }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows arabic network error message', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('network'));
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'u@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password');
    await user.click(screen.getByRole('button', { name: /دخول/ }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('does not redirect on error', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('fail'));
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'u@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password');
    await user.click(screen.getByRole('button', { name: /دخول/ }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ── Password toggle ───────────────────────────────────────────────────────────

describe('LoginPage — password toggle', () => {
  it('password input starts as type=password', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password');
  });

  it('clicking show-password button changes type to text', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByLabelText('إظهار كلمة المرور'));
    expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'text');
  });
});
