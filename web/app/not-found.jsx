import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container" style={{ padding: '96px 0', textAlign: 'center' }}>
      <span className="eyebrow">404</span>
      <h1 className="font-display" style={{ fontSize: 40, margin: '10px 0 12px' }}>
        <span className="text-brand-gradient">Dish not found</span>
      </h1>
      <p style={{ color: 'var(--muted-foreground)' }}>
        This dish isn&apos;t on the menu — it may have been unpublished.
      </p>
      <p style={{ marginTop: 18 }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '11px 18px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--brand)',
            color: 'var(--brand-foreground)',
            fontWeight: 600,
          }}
        >
          Back to menu
        </Link>
      </p>
    </main>
  );
}
