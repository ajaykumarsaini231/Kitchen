import { useState } from 'react';
import { login } from '../api.js';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@metnmat.com');
  const [password, setPassword] = useState('admin123');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { token, user } = await login(email, password);
      onLogin(token, user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap bg-grid">
      <form className="login-card bg-hero-glow" onSubmit={submit}>
        <span className="eyebrow">METNMAT · Menu Management</span>
        <h1 className="font-display login-title">
          <span className="text-brand-gradient">Dish Dashboard</span>
        </h1>
        <p className="login-sub">Sign in to manage the menu</p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="login-error">{error}</p>}

        <button className="login-btn" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="login-hint">
          <span>Demo accounts</span>
          <code>admin@metnmat.com / admin123</code>
          <code>viewer@metnmat.com / viewer123 (read-only)</code>
        </div>
      </form>
    </div>
  );
}
