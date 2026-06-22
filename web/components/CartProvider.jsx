'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import CartDrawer from './CartDrawer';

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart');
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const add = (dish, qty = 1) =>
    setItems((prev) => {
      const ex = prev.find((i) => i.dishId === dish.dishId);
      if (ex) {
        return prev.map((i) => (i.dishId === dish.dishId ? { ...i, qty: i.qty + qty } : i));
      }
      return [
        ...prev,
        {
          dishId: dish.dishId,
          dishName: dish.dishName,
          price: dish.price,
          imageUrl: dish.imageUrl,
          qty,
        },
      ];
    });

  const setQty = (id, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.dishId !== id)
        : prev.map((i) => (i.dishId === id ? { ...i, qty } : i))
    );

  const remove = (id) => setItems((prev) => prev.filter((i) => i.dishId !== id));
  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);

  const value = {
    items,
    add,
    setQty,
    remove,
    clear,
    count,
    subtotal,
    open,
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
  };

  return (
    <CartCtx.Provider value={value}>
      {children}
      <CartDrawer />
    </CartCtx.Provider>
  );
}
