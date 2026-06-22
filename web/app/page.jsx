import { Suspense } from 'react';
import MenuBrowser from '../components/MenuBrowser';
import { getPublishedDishes } from '../lib/api';
import { SITE_URL } from '../lib/config';

export const revalidate = 60;

function SkeletonGrid() {
  return (
    <div className="menu-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="skeleton" key={i}>
          <div className="ph img" />
          <div className="ph line" style={{ width: '70%' }} />
          <div className="ph line" style={{ width: '40%' }} />
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const dishes = await getPublishedDishes();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'METNMAT Kitchen',
    url: SITE_URL,
    servesCuisine: 'International',
    hasMenu: {
      '@type': 'Menu',
      hasMenuSection: {
        '@type': 'MenuSection',
        name: 'Menu',
        hasMenuItem: dishes.map((d) => ({
          '@type': 'MenuItem',
          name: d.dishName,
          url: `${SITE_URL}/dish/${d.dishId}`,
          image: d.imageUrl || undefined,
        })),
      },
    },
  };

  return (
    <main>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">METNMAT Kitchen</span>
          <h1>
            Today&apos;s <span className="text-brand-gradient">Menu</span>
          </h1>
          <p>
            Fresh, handcrafted dishes — published live from our kitchen. The menu
            updates in real time as new dishes go out.
          </p>
        </div>
      </section>

      <div className="container">
        <Suspense fallback={<SkeletonGrid />}>
          <MenuBrowser initialDishes={dishes} />
        </Suspense>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
