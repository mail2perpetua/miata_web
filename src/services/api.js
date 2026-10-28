// REST client for the MIATA API.
// - The short-lived access token lives only in memory (never localStorage).
// - The refresh token is an httpOnly cookie the browser sends to /api/auth/* automatically.
// - On an expired access token the request is retried once after a single shared refresh.

// Empty in development (Vite proxies /api) and when the API is served from the same origin;
// otherwise the API origin, e.g. https://api.miata.example.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = `${API_ORIGIN}/api`;
const XHR_HEADER = { 'X-Requested-With': 'XMLHttpRequest' };
// Codes that mean "try refreshing"; anything else on a 401 ends the session immediately.
const REFRESHABLE = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHORIZED']);

let accessToken = null;
let refreshPromise = null;
let sessionEndedHandler = () => {};

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details || {};
  }
}

export const setAccessToken = (token) => {
  accessToken = token;
};

/** Called with the error code when the server ends the session (revoked, disabled, reset required). */
export const onSessionEnded = (handler) => {
  sessionEndedHandler = handler;
};

function buildUrl(path, query) {
  const url = `${API_BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseError(res) {
  const body = await res.json().catch(() => null);
  const err = body?.error;
  return new ApiError(
    res.status,
    err?.code || 'HTTP_ERROR',
    err?.message || (res.status >= 500 ? 'The server is unavailable. Please try again.' : 'Request failed'),
    err?.details,
  );
}

/** Exchange the refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include', headers: XHR_HEADER })
      .then(async (res) => {
        if (!res.ok) throw await parseError(res);
        const { data } = await res.json();
        if (!data) throw new ApiError(401, 'NO_SESSION', 'Please sign in');
        accessToken = data.accessToken;
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function send(path, { method = 'GET', body, query, signal, raw = false, retry = true } = {}) {
  const isForm = body instanceof FormData;
  const headers = { ...XHR_HEADER };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
  }

  // Credential endpoints report their own 401s (wrong password, bad reset link) to the form.
  const credentialFlow = /^\/auth\/(login|register|refresh|logout|forgot-password|reset-password)/.test(path);
  if (res.status === 401 && !credentialFlow) {
    const error = await parseError(res);
    if (retry && REFRESHABLE.has(error.code)) {
      try {
        await refreshSession();
      } catch (refreshError) {
        sessionEndedHandler(refreshError.code || error.code);
        throw refreshError;
      }
      return send(path, { method, body, query, signal, raw, retry: false });
    }
    sessionEndedHandler(error.code);
    throw error;
  }

  if (!res.ok) throw await parseError(res);
  if (raw) return res;
  if (res.status === 204) return { data: null };
  return res.json();
}

export const api = {
  get: (path, query, opts) => send(path, { ...opts, query }),
  post: (path, body, opts) => send(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => send(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => send(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => send(path, { ...opts, method: 'DELETE' }),
  raw: (path, query) => send(path, { query, raw: true }),
};

/**
 * Multipart upload with progress (fetch cannot report upload progress).
 * `onProgress` receives 0–100. Retries once after refreshing an expired token.
 */
export function upload(path, formData, { method = 'POST', onProgress, retry = true } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, buildUrl(path));
    xhr.withCredentials = true;
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK_ERROR', 'Upload failed. Check your connection and try again.'));
    xhr.onload = () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(body);
      const err = new ApiError(
        xhr.status,
        body?.error?.code || 'HTTP_ERROR',
        body?.error?.message || 'Upload failed',
        body?.error?.details,
      );
      if (xhr.status === 401 && retry && REFRESHABLE.has(err.code)) {
        refreshSession()
          .then(() => resolve(upload(path, formData, { method, onProgress, retry: false })))
          .catch((e) => {
            sessionEndedHandler(e.code);
            reject(e);
          });
        return;
      }
      if (xhr.status === 401) sessionEndedHandler(err.code);
      reject(err);
    };
    xhr.send(formData);
  });
}

/** Download an authenticated file (CSV export, submission, attachment) and save it with its server filename. */
export async function download(path, query, fallbackName = 'download') {
  const res = await api.raw(path, query);
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/i) || disposition.match(/filename="?([^";]+)"?/i);
  const filename = match ? decodeURIComponent(match[1]) : fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Build a form-data body from a plain object, skipping null/undefined. */
export function toFormData(fields, files = {}) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) fd.append(key, typeof value === 'boolean' ? String(value) : value);
  }
  for (const [key, file] of Object.entries(files)) if (file) fd.append(key, file);
  return fd;
}

export const apiPath = (path) => `${API_BASE}${path}`;

/** Absolute URL for an API-relative link returned by the server (e.g. a signed video stream URL). */
export const apiUrl = (url) => (url && url.startsWith('/api/') ? `${API_ORIGIN}${url}` : url);
