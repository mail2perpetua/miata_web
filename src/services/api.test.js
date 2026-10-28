import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, onSessionEnded, setAccessToken } from './api';

const json = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  headers: new Headers(),
});

afterEach(() => {
  vi.unstubAllGlobals();
  setAccessToken(null);
});

describe('API client session handling', () => {
  it('refreshes an expired access token once and retries the request', async () => {
    setAccessToken('old');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(401, { error: { code: 'TOKEN_EXPIRED', message: 'expired' } }))
      .mockResolvedValueOnce(json(200, { data: { accessToken: 'new', user: { id: 1 } } }))
      .mockResolvedValueOnce(json(200, { data: { ok: true } }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await api.get('/student/dashboard');
    expect(res.data.ok).toBe(true);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new');
  });

  it('shares one refresh between concurrent requests', async () => {
    setAccessToken('old');
    const fetchMock = vi.fn(async (url) => {
      if (url === '/api/auth/refresh') return json(200, { data: { accessToken: 'new' } });
      return fetchMock.mock.calls.filter(([u]) => u === url).length === 1
        ? json(401, { error: { code: 'TOKEN_EXPIRED' } })
        : json(200, { data: url });
    });
    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([api.get('/a'), api.get('/b')]);
    expect(fetchMock.mock.calls.filter(([u]) => u === '/api/auth/refresh')).toHaveLength(1);
  });

  it('ends the session without refreshing when the server revoked it', async () => {
    const ended = vi.fn();
    onSessionEnded(ended);
    const fetchMock = vi.fn().mockResolvedValue(json(401, { error: { code: 'SESSION_REVOKED', message: 'ended' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get('/student/courses')).rejects.toMatchObject({ code: 'SESSION_REVOKED' });
    expect(ended).toHaveBeenCalledWith('SESSION_REVOKED');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('turns server validation errors into ApiError details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json(422, { error: { code: 'VALIDATION_ERROR', message: 'Fix', details: { email: 'Bad' } } })),
    );
    await expect(api.post('/auth/register', {})).rejects.toMatchObject({ status: 422, details: { email: 'Bad' } });
  });
});
