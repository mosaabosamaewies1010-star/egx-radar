/**
 * Tests for Register page (/register)
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/register/page';

const mockPush    = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter:   () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/register',
}));

const mockStore = {
  lang:            'ar' as const,
  user:            null as null,
  token:           null as null,
  setUser:         jest.fn(),
  setToken:        jest.fn(),
  logout:          jest.fn(),
  initAuth:        jest.fn(),
  regime:          'SIDEWAYS' as const,
  regimeData:      null,
  setRegime:       jest.fn(),
  shariaFilter:    false,
  setShariaFilter: jest.fn(),
  setLang:         jest.fn(),
};
jest.mock('@/lib/store', () => ({ useAppStore: () => mockStore }));

const mockRegister = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { register: (...a: unknown[]) => mockRegister(...a) },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, msg: string) { super(msg); this.status = status; }
  },
}));

beforeEach(() => {
  mockRegister.mockReset();
  mockPush.mockReset();
  mockReplace.mockReset();
  mockStore.user = null;
  mockStore.setUser.mockReset();
  mockStore.setToken.mockReset();
});

// ── Render ────────────────────────────────────────────────────────────────────

describe('RegisterPage — render', () => {
  it('renders name input', () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText(/مثال:/)).toBeInTheDocument();
  });

  it('renders email input', () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('button', { name: /إنشاء حساب/ })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: /ادخل الآن/ })).toBeInTheDocument();
  });

  it('renders password hint text', () => {
    render(<RegisterPage />);
    expect(screen.getByText(/8 أحرف/)).toBeInTheDocument();
  });

  it('renders disclaimer', () => {
    render(<RegisterPage />);
    expect(screen.getByText(/تجريبية فقط/)).toBeInTheDocument();
  });
});

// ── Success ───────────────────────────────────────────────────────────────────

describe('RegisterPage — success', () => {
  const fakeUser = { id: 2, email: 'new@e.com', name: 'Ali', is_pro: false, created_at: '' };

  beforeEach(() => {
    mockRegister.mockResolvedValue({ token: 'newtoken', user: fakeUser });
  });

  it('calls api.register with correct args', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText(/مثال:/),      'Ali');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'new@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'),   'securepass1');
    await user.click(screen.getByRole('button', { name: /إنشاء حساب/ }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('new@e.com', 'securepass1', 'Ali')
    );
  });

  it('calls setToken on success', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'new@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'),   'securepass1');
    await user.click(screen.getByRole('button', { name: /إنشاء حساب/ }));

    await waitFor(() => expect(mockStore.setToken).toHaveBeenCalledWith('newtoken'));
  });

  it('redirects to home on success', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'new@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'),   'securepass1');
    await user.click(screen.getByRole('button', { name: /إنشاء حساب/ }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });
});

// ── Validation ────────────────────────────────────────────────────────────────

describe('RegisterPage — client-side validation', () => {
  it('shows error for password shorter than 8 chars without calling API', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'x@x.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'abc');
    await user.click(screen.getByRole('button', { name: /إنشاء حساب/ }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(mockRegister).not.toHaveBeenCalled();
  });
});

// ── Error ─────────────────────────────────────────────────────────────────────

describe('RegisterPage — API error', () => {
  it('shows alert on API error', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue(new Error('البريد الإلكتروني مستخدم بالفعل'));
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'dup@e.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /إنشاء حساب/ }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('does not redirect on error', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue(new Error('fail'));
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'x@x.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /إنشاء حساب/ }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(mockPush).not.toHaveBeenCalled();
  });
});
