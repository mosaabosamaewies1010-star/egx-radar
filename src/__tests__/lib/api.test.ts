/**
 * Tests for the API client — all HTTP is mocked via global.fetch.
 */
import { api, ApiError } from '@/lib/api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockOk(body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockError(status: number, text = 'Error') {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: text,
    text: () => Promise.resolve(text),
  });
}

beforeEach(() => mockFetch.mockReset());

describe('api.getStock', () => {
  it('returns parsed stock data on success', async () => {
    const payload = { symbol: 'COMI', name_ar: 'بنك القاهرة', score: 82 };
    mockOk(payload);
    const result = await api.getStock('comi');
    expect(result).toEqual(payload);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stocks/COMI'),
      expect.any(Object),
    );
  });

  it('uppercases the symbol in the URL', async () => {
    mockOk({});
    await api.getStock('efih');
    expect(mockFetch.mock.calls[0][0]).toContain('/api/stocks/EFIH');
  });

  it('throws ApiError with status on HTTP error', async () => {
    mockError(404, 'Not found');
    await expect(api.getStock('XXXX')).rejects.toBeInstanceOf(ApiError);
  });

  it('sets correct status on ApiError', async () => {
    mockError(404, 'Not found');
    try {
      await api.getStock('XXXX');
    } catch (e) {
      expect((e as ApiError).status).toBe(404);
    }
  });
});

describe('api.getRegime', () => {
  it('calls /api/market/regime', async () => {
    mockOk({ regime: 'BULL', confidence: 78 });
    const result = await api.getRegime();
    expect(result.regime).toBe('BULL');
    expect(mockFetch.mock.calls[0][0]).toContain('/api/market/regime');
  });
});

describe('api.getOpportunities', () => {
  it('calls /api/opportunities without params by default', async () => {
    mockOk({ total: 0, limit: 20, offset: 0, items: [] });
    await api.getOpportunities();
    expect(mockFetch.mock.calls[0][0]).toContain('/api/opportunities');
  });

  it('appends sharia=1 when sharia option is set', async () => {
    mockOk({ total: 0, limit: 20, offset: 0, items: [] });
    await api.getOpportunities({ sharia: true });
    expect(mockFetch.mock.calls[0][0]).toContain('sharia=1');
  });

  it('appends limit and offset params', async () => {
    mockOk({ total: 0, limit: 5, offset: 10, items: [] });
    await api.getOpportunities({ limit: 5, offset: 10 });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('limit=5');
    expect(url).toContain('offset=10');
  });
});

describe('api.health', () => {
  it('returns status ok', async () => {
    mockOk({ status: 'ok' });
    const result = await api.health();
    expect(result.status).toBe('ok');
  });
});

describe('ApiError', () => {
  it('is instanceof Error', () => {
    const err = new ApiError(500, 'Server error');
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(500);
    expect(err.name).toBe('ApiError');
  });
});
