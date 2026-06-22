import Link from 'next/link';

export default function Footer() {
  const year = 2026;
  return (
    <footer className="site-footer">
      <div className="container bar">
        <span>© {year} METNMAT Kitchen. All rights reserved.</span>
        <span>
          <Link href="/">Menu</Link> · <Link href="/about">About</Link>
        </span>
      </div>
    </footer>
  );
}
