import React, { useState } from 'react';

export default function AuthScreen({ SERVER_URL, onAuthed }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const r = await fetch(`${SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Auth failed');
      onAuthed({ userId: data.userId, username: data.username, token: data.token });
    } catch (e) {
      setError(e.message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__logo">
          <div className="auth-card__logo-icon">slack</div>
        </div>
        <h1 className="auth-card__title">
          {mode === 'login' ? 'Sign in to Slack' : 'Create your account'}
        </h1>
        <p className="auth-card__subtitle">
          {mode === 'login'
            ? 'We suggest using the email address you use at work.'
            : 'First, enter your details to get started.'}
        </p>

        <div className="auth-card__tabs">
          <button
            className={`auth-card__tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-card__tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        <div className="auth-card__form">
          <div className="auth-card__input-group">
            <label className="auth-card__input-label">Username</label>
            <input
              className="auth-card__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="name@work-email.com"
              autoFocus
            />
          </div>
          <div className="auth-card__input-group">
            <label className="auth-card__input-label">Password</label>
            <input
              className="auth-card__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Your password"
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>

          {error && <div className="auth-card__error">{error}</div>}

          <button
            className="auth-card__submit"
            onClick={submit}
            disabled={loading || !username.trim() || !password.trim()}
          >
            {loading
              ? 'Please wait...'
              : mode === 'register'
              ? 'Create Account'
              : 'Sign In with Password'}
          </button>
        </div>

        <div className="auth-card__footer">
          Create two accounts in different browser tabs to test<br />
          real-time messaging, presence, and typing indicators.
        </div>
      </div>
    </div>
  );
}
