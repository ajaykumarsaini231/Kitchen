export const metadata = {
  title: 'About',
  description: 'About METNMAT Kitchen.',
};

export default function AboutPage() {
  return (
    <main className="container" style={{ padding: '48px 0 72px', maxWidth: 720 }}>
      <span className="eyebrow">METNMAT Kitchen</span>
      <h1 className="font-display" style={{ fontSize: 'clamp(28px,5vw,40px)', margin: '8px 0 16px' }}>
        About <span className="text-brand-gradient">us</span>
      </h1>
      <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
        METNMAT Kitchen serves fresh, handcrafted dishes prepared daily. Our menu is
        managed in real time — when our team publishes a new dish, it appears here
        instantly. Browse the current menu and discover today&apos;s offerings.
      </p>
      <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
        This is a demo storefront powered by the same database and API as our internal
        management dashboard.
      </p>
    </main>
  );
}
