'use client';

import { useCart } from './CartProvider';

export default function AddToCartButton({ dish, label = 'Add to cart', block = false }) {
  const cart = useCart();
  return (
    <button
      className={`btn-brand add-btn ${block ? 'block' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        cart.add(dish);
        cart.openCart();
      }}
    >
      + {label}
    </button>
  );
}
