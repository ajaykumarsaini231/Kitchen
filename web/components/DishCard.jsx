'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import AddToCartButton from './AddToCartButton';
import { formatINR } from '../lib/format';

const FALLBACK = 'https://placehold.co/600x450?text=Dish';

export default function DishCard({ dish }) {
  const [src, setSrc] = useState(dish.imageUrl || FALLBACK);

  return (
    <div className="dish">
      <Link href={`/dish/${dish.dishId}`} className="dish-img" aria-label={dish.dishName}>
        <span className="badge">Published</span>
        <Image
          src={src}
          alt={dish.dishName}
          fill
          sizes="(max-width: 600px) 100vw, 300px"
          onError={() => setSrc(FALLBACK)}
        />
      </Link>
      <div className="dish-body">
        <div className="dish-row">
          <h3 className="dish-name">
            <Link href={`/dish/${dish.dishId}`}>{dish.dishName}</Link>
          </h3>
          <span className="dish-price">{formatINR(dish.price)}</span>
        </div>
        {dish.description && <p className="dish-desc">{dish.description}</p>}
        <AddToCartButton dish={dish} block />
      </div>
    </div>
  );
}
