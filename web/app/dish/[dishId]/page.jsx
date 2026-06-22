import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDish } from '../../../lib/api';
import { SITE_URL } from '../../../lib/config';
import { formatINR } from '../../../lib/format';
import AddToCartButton from '../../../components/AddToCartButton';

export const revalidate = 60;

const FALLBACK = 'https://placehold.co/800x600?text=Dish';

export async function generateMetadata({ params }) {
  const dish = await getDish(params.dishId);
  if (!dish || !dish.isPublished) {
    return { title: 'Dish not found' };
  }
  const image = dish.imageUrl || FALLBACK;
  return {
    title: dish.dishName,
    description: `${dish.dishName} — on the METNMAT Kitchen menu.`,
    alternates: { canonical: `${SITE_URL}/dish/${dish.dishId}` },
    openGraph: {
      title: dish.dishName,
      description: `${dish.dishName} — on the METNMAT Kitchen menu.`,
      type: 'article',
      url: `${SITE_URL}/dish/${dish.dishId}`,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: dish.dishName, images: [image] },
  };
}

export default async function DishPage({ params }) {
  const dish = await getDish(params.dishId);
  if (!dish || !dish.isPublished) notFound();

  const image = dish.imageUrl || FALLBACK;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: dish.dishName,
    image,
    url: `${SITE_URL}/dish/${dish.dishId}`,
  };

  return (
    <main className="detail container">
      <Link href="/" className="back">
        ← Back to menu
      </Link>
      <div className="detail-grid">
        <div className="detail-img">
          <Image
            src={image}
            alt={dish.dishName}
            fill
            sizes="(max-width: 720px) 100vw, 600px"
            priority
          />
        </div>
        <div>
          <span className="eyebrow">METNMAT Kitchen</span>
          <h1 className="font-display">{dish.dishName}</h1>
          <p className="detail-price">{formatINR(dish.price)}</p>
          <p style={{ color: 'var(--muted-foreground)', maxWidth: 460 }}>
            {dish.description ||
              'A handcrafted favourite from our kitchen, freshly prepared and currently available on the menu.'}
          </p>
          <div style={{ marginTop: 16, maxWidth: 280 }}>
            <AddToCartButton dish={dish} block label="Add to cart" />
          </div>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
