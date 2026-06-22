'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import DishCard from './DishCard';
import { SOCKET_URL } from '../lib/config';
import { fetchPublishedDishesClient } from '../lib/api';

export default function MenuBrowser({ initialDishes }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dishes, setDishes] = useState(initialDishes || []);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debounced, setDebounced] = useState(query);
  const firstRender = useRef(true);

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim().toLowerCase()), 220);
    return () => clearTimeout(id);
  }, [query]);

  // Reflect search in the URL (shareable links), without scrolling.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (debounced) params.set('q', debounced);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [debounced, router]);

  // Real-time: when the CMS publishes/unpublishes, refresh the public list.
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    const refresh = async () => {
      try {
        setDishes(await fetchPublishedDishesClient());
      } catch {
        /* ignore transient errors */
      }
    };
    socket.on('dish:updated', refresh);
    socket.on('dishes:resync', refresh);
    return () => socket.close();
  }, []);

  const visible = useMemo(() => {
    if (!debounced) return dishes;
    return dishes.filter((d) => d.dishName.toLowerCase().includes(debounced));
  }, [dishes, debounced]);

  return (
    <>
      <div className="toolbar">
        <div className="search-wrap">
          <span className="icon" aria-hidden>
            ⌕
          </span>
          <input
            className="search-input"
            type="search"
            placeholder="Search dishes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search dishes"
          />
        </div>
        <span className="count-pill">
          {visible.length} {visible.length === 1 ? 'dish' : 'dishes'}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="state">
          {dishes.length === 0
            ? 'No dishes on the menu yet — check back soon.'
            : 'No dishes match your search.'}
        </p>
      ) : (
        <div className="menu-grid">
          {visible.map((d) => (
            <DishCard key={d.dishId} dish={d} />
          ))}
        </div>
      )}
    </>
  );
}
