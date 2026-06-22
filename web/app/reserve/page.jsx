'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createReservation } from '../../lib/api';

export default function ReservePage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '19:00',
    partySize: 2,
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await createReservation({
        ...form,
        partySize: Number(form.partySize),
      });
      setDone(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <main className="container confirm">
        <div className="confirm-badge">✓</div>
        <h1 className="font-display">
          Table <span className="text-brand-gradient">requested</span>
        </h1>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Thanks {done.name} — we&apos;ve received your request for {done.partySize}{' '}
          {done.partySize === 1 ? 'guest' : 'guests'} on <strong>{done.date}</strong> at{' '}
          <strong>{done.time}</strong>. Status: <strong>{done.status}</strong>. We&apos;ll
          confirm by phone.
        </p>
        <Link href="/" className="btn-brand" style={{ display: 'inline-block', marginTop: 18 }}>
          Back to menu
        </Link>
      </main>
    );
  }

  return (
    <main className="container reserve">
      <span className="eyebrow">METNMAT Kitchen</span>
      <h1 className="font-display">
        Book a <span className="text-brand-gradient">table</span>
      </h1>
      <p style={{ color: 'var(--muted-foreground)', maxWidth: 460 }}>
        Reserve your spot — pick a date, time and party size and we&apos;ll confirm.
      </p>

      <form className="reserve-form" onSubmit={submit}>
        <label className="field">
          <span>Full name *</span>
          <input value={form.name} onChange={set('name')} required />
        </label>
        <label className="field">
          <span>Phone *</span>
          <input value={form.phone} onChange={set('phone')} required />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={set('email')} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Date *</span>
            <input type="date" value={form.date} onChange={set('date')} required />
          </label>
          <label className="field">
            <span>Time *</span>
            <input type="time" value={form.time} onChange={set('time')} required />
          </label>
          <label className="field">
            <span>Guests *</span>
            <input
              type="number"
              min="1"
              max="50"
              value={form.partySize}
              onChange={set('partySize')}
              required
            />
          </label>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Any requests?" />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button className="btn-brand block" disabled={busy}>
          {busy ? 'Booking…' : 'Request table'}
        </button>
      </form>
    </main>
  );
}
