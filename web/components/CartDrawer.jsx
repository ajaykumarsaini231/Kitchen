'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { formatINR } from '../lib/format';

export default function CartDrawer() {
  const cart = useCart();
  if (!cart) return null;
  const { items, open, closeCart, setQty, remove, subtotal } = cart;

  return (
    <>
      <div
        className={`drawer-overlay ${open ? 'show' : ''}`}
        onClick={closeCart}
        aria-hidden={!open}
      />
      <aside className={`cart-drawer ${open ? 'open' : ''}`} aria-label="Your cart">
        <div className="cart-head">
          <h2 className="font-display">Your order</h2>
          <button className="icon-btn" onClick={closeCart} aria-label="Close cart">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <p className="state">Your cart is empty. Add some dishes!</p>
        ) : (
          <>
            <div className="cart-items">
              {items.map((i) => (
                <div className="cart-item" key={i.dishId}>
                  <div className="ci-info">
                    <span className="ci-name">{i.dishName}</span>
                    <span className="ci-price">{formatINR(i.price)}</span>
                  </div>
                  <div className="qty">
                    <button onClick={() => setQty(i.dishId, i.qty - 1)} aria-label="Decrease">
                      −
                    </button>
                    <span>{i.qty}</span>
                    <button onClick={() => setQty(i.dishId, i.qty + 1)} aria-label="Increase">
                      +
                    </button>
                  </div>
                  <button className="ci-remove" onClick={() => remove(i.dishId)} aria-label="Remove">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-foot">
              <div className="cart-subtotal">
                <span>Subtotal</span>
                <strong>{formatINR(subtotal)}</strong>
              </div>
              <Link href="/checkout" className="btn-brand" onClick={closeCart}>
                Checkout →
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
