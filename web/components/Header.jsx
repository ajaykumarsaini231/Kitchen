'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';

export default function Header() {
  const [theme, setTheme] = useState('dark');
  const cart = useCart();

  useEffect(() => {
    const saved =
      typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
    setTheme(saved === 'light' ? 'light' : 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* ignore */
    }
  };

  return (
    <header className="site-header">
      <div className="container bar">
        <Link href="/" className="brand-mark" aria-label="METNMAT Kitchen home">
          <span className="brand-dot" />
          <span>
            METNMAT <span className="text-brand-gradient">Kitchen</span>
          </span>
        </Link>
        <nav className="nav-links">
          <Link href="/">Menu</Link>
          <Link href="/reserve">Book a table</Link>
          <Link href="/about">About</Link>
          <button
            className="cart-btn"
            onClick={() => cart?.openCart()}
            aria-label="Open cart"
          >
            🛒 Cart
            {cart?.count > 0 && <span className="cart-count">{cart.count}</span>}
          </button>
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label="Toggle light or dark theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </nav>
      </div>
    </header>
  );
}
