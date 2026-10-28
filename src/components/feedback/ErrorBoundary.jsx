import { Component } from 'react';

// A page's code could not be downloaded: the dev server restarted or a new version was deployed since the tab opened.
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|Loading chunk/i;
const RELOADED_KEY = 'miata:chunk-reload';

function reloadOnceForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_KEY) || 0);
    if (Date.now() - last < 60_000) return false; // already tried: show the message instead of looping
    sessionStorage.setItem(RELOADED_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

const panel = {
  maxWidth: 520,
  margin: '12vh auto',
  padding: '32px 28px',
  textAlign: 'center',
  fontFamily: 'inherit',
  color: '#0f2547',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  boxShadow: '0 10px 30px rgba(15, 37, 71, 0.08)',
};
const button = {
  display: 'inline-block',
  margin: '6px',
  padding: '10px 18px',
  borderRadius: 8,
  border: '1px solid #0f2547',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
};

/**
 * Catches an error while rendering a page, so one broken page shows a message instead of blanking the whole app.
 * `resetKey` (the current path) clears the error when the user navigates elsewhere.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page error', error, info?.componentStack);
    if (CHUNK_ERROR.test(error?.message ?? '')) reloadOnceForNewVersion();
  }

  componentDidUpdate(previous) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const newVersion = CHUNK_ERROR.test(error.message ?? '');
    return (
      <div role="alert" style={panel}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 10px' }}>
          {newVersion ? 'This page needs a refresh' : 'This page could not be displayed'}
        </h1>
        <p style={{ margin: '0 0 20px', color: '#475569', lineHeight: 1.6 }}>
          {newVersion
            ? 'MIATA was updated since this tab was opened. Reload to get the latest version.'
            : 'Something went wrong while showing this page. Reload it, or go back to the home page.'}
        </p>
        <button type="button" style={{ ...button, background: '#0f2547', color: '#fff' }} onClick={() => window.location.reload()}>
          Reload page
        </button>
        <a href="/" style={{ ...button, background: '#fff', color: '#0f2547' }}>
          Go to home page
        </a>
      </div>
    );
  }
}
