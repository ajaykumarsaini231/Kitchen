import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrder } from '../../../lib/api';
import { formatINR } from '../../../lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Order confirmed', robots: { index: false } };

export default async function OrderPage({ params }) {
  const order = await getOrder(params.orderNumber);
  if (!order) notFound();

  return (
    <main className="container confirm">
      <div className="confirm-badge">✓</div>
      <span className="eyebrow">Order {order.orderNumber}</span>
      <h1 className="font-display">
        Thank you, <span className="text-brand-gradient">{order.customer.name}</span>!
      </h1>
      <p style={{ color: 'var(--muted-foreground)' }}>
        Your order is <strong>{order.status}</strong>
        {order.paymentStatus === 'paid' ? ' · paid' : ' · pay on arrival'} ·{' '}
        {order.orderType}
      </p>

      <div className="confirm-card">
        {order.items.map((i) => (
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
          <span>{formatINR(order.subtotal)}</span>
        </div>
        <div className="sum-row">
          <span>Tax</span>
          <span>{formatINR(order.tax)}</span>
        </div>
        <div className="sum-row">
          <span>Delivery</span>
          <span>{order.deliveryFee ? formatINR(order.deliveryFee) : 'Free'}</span>
        </div>
        <div className="sum-row total">
          <strong>Total</strong>
          <strong>{formatINR(order.total)}</strong>
        </div>
      </div>

      <Link href="/" className="btn-brand" style={{ display: 'inline-block', marginTop: 22 }}>
        Back to menu
      </Link>
    </main>
  );
}
