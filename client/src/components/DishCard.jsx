import { useEffect, useRef, useState } from 'react';

const FALLBACK_IMG = 'https://placehold.co/600x400?text=No+Image';

export default function DishCard({ dish, onToggle, busy, canEdit = true }) {
  const [imgSrc, setImgSrc] = useState(dish.imageUrl || FALLBACK_IMG);
  const [flash, setFlash] = useState(false);
  const prevPublished = useRef(dish.isPublished);

  // Briefly highlight the card whenever its published state changes (e.g. via
  // a real-time update from the backend).
  useEffect(() => {
    if (prevPublished.current !== dish.isPublished) {
      prevPublished.current = dish.isPublished;
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 900);
      return () => clearTimeout(id);
    }
  }, [dish.isPublished]);

  return (
    <div
      className={`card ${dish.isPublished ? 'is-published' : 'is-unpublished'} ${
        flash ? 'card-flash' : ''
      }`}
    >
      <div className="card-img-wrap">
        <img
          src={imgSrc}
          alt={dish.dishName}
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMG)}
        />
        <span className={`badge ${dish.isPublished ? 'badge-on' : 'badge-off'}`}>
          {dish.isPublished ? 'Published' : 'Unpublished'}
        </span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{dish.dishName}</h3>
        <p className="card-id">
          ID: {dish.dishId}
          {dish.price ? <span className="card-price"> · ₹{dish.price}</span> : null}
        </p>

        <button
          className={`toggle-btn ${dish.isPublished ? 'on' : 'off'}`}
          onClick={() => onToggle(dish.dishId)}
          disabled={busy || !canEdit}
          title={canEdit ? undefined : 'Read-only: admin role required'}
        >
          {busy ? 'Saving…' : dish.isPublished ? 'Unpublish' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
