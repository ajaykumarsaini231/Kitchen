'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../components/CartProvider';
import { createOrder } from '../../lib/api';
import { formatINR } from '../../lib/format';

const TAX_RATE = 0.05;
const DELIVERY_FEE = 40;

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    orderType: 'delivery',
    paymentMethod: 'cod',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = Math.round(subtotal * TAX_RATE);
  const deliveryFee = form.orderType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + tax + deliveryFee;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit = useMemo(
    () => items.length > 0 && form.name.trim() && form.phone.trim().length >= 5,
    [items, form]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const order = await createOrder({
        items: items.map((i) => ({ dishId: i.dishId, qty: i.qty })),
        customer: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
        },
        orderType: form.orderType,
        paymentMethod: form.paymentMethod,
      });
      cart.clear();
      router.push(`/order/${order.orderNumber}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="container" style={{ padding: '64px 0', textAlign: 'center' }}>
        <h1 className="font-display" style={{ fontSize: 30 }}>Your cart is empty</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Add some dishes to place an order.</p>
        <Link href="/" className="btn-brand" style={{ display: 'inline-block', marginTop: 16 }}>
          Browse menu
        </Link>
      </main>
    );
  }

  return (
    <main className="container checkout">
      <h1 className="font-display">Checkout</h1>
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={submit}>
          <h2 className="section-title">Contact</h2>
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

          <h2 className="section-title">Order type</h2>
          <div className="seg">
            {['delivery', 'pickup', 'dine-in'].map((t) => (
              <button
                type="button"
                key={t}
                className={form.orderType === t ? 'on' : ''}
                onClick={() => setForm((f) => ({ ...f, orderType: t }))}
              >
                {t}
              </button>
            ))}
          </div>
          {form.orderType === 'delivery' && (
            <label className="field">
              <span>Delivery address *</span>
              <textarea value={form.address} onChange={set('address')} rows={2} required />
            </label>
          )}

          <h2 className="section-title">Payment</h2>
          <div className="pay-options">
            <label className={`pay-opt ${form.paymentMethod === 'cod' ? 'on' : ''}`}>
              <input
                type="radio"
                name="pay"
                checked={form.paymentMethod === 'cod'}
                onChange={() => setForm((f) => ({ ...f, paymentMethod: 'cod' }))}
              />
              Pay on {form.orderType === 'delivery' ? 'delivery' : 'pickup'} (Cash)
            </label>
            <label className={`pay-opt ${form.paymentMethod === 'demo-card' ? 'on' : ''}`}>
              <input
                type="radio"
                name="pay"
                checked={form.paymentMethod === 'demo-card'}
                onChange={() => setForm((f) => ({ ...f, paymentMethod: 'demo-card' }))}
              />
              Pay now by card (demo)
            </label>
          </div>
          {form.paymentMethod === 'demo-card' && (
            <div className="card-box">
              <p className="demo-note">⚠ Demo payment — no real card is charged.</p>
              <input className="card-input" placeholder="4242 4242 4242 4242" />
              <div className="card-row">
                <input className="card-input" placeholder="MM/YY" />
                <input className="card-input" placeholder="CVC" />
              </div>
            </div>
          )}

          {error && <p className="login-error">{error}</p>}
          <button className="btn-brand block" disabled={!canSubmit || busy}>
            {busy
              ? 'Placing order…'
              : form.paymentMethod === 'demo-card'
                ? `Pay ${formatINR(total)} & place order`
                : `Place order · ${formatINR(total)}`}
          </button>
        </form>

        <aside className="order-summary">
          <h2 className="section-title">Order summary</h2>
          {items.map((i) => (
            <div className="sum-row" key={i.dishId}>
              <span>
                {i.qty}× {i.dishName}
              </span>
              <span>{formatINR(i.price * i.qty)}</span>
            </div>
          ))}
          <hr />
          <div className="sum-row">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="sum-row">
            <span>Tax (5%)</span>
            <span>{formatINR(tax)}</span>
          </div>
          <div className="sum-row">
            <span>Delivery</span>
            <span>{deliveryFee ? formatINR(deliveryFee) : 'Free'}</span>
          </div>
          <div className="sum-row total">
            <strong>Total</strong>
            <strong>{formatINR(total)}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}
