import { useCallback, useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { fetchDishes, toggleDish, simulateExternalChange } from './api.js';
import { getUser, setAuth, clearAuth } from './auth.js';
import { socket } from './socket.js';
import DishCard from './components/DishCard.jsx';
import SkeletonCard from './components/Skeleton.jsx';
import Login from './components/Login.jsx';
import AddProductModal from './components/AddProductModal.jsx';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'unpublished', label: 'Unpublished' },
];

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [connected, setConnected] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const [user, setUser] = useState(() => getUser());
  const canEdit = user?.role === 'admin';
  const [showAdd, setShowAdd] = useState(false);

  const handleCreated = useCallback((dish) => {
    setDishes((prev) =>
      prev.some((d) => d.dishId === dish.dishId)
        ? prev
        : [...prev, dish].sort((a, b) =>
            a.dishId.localeCompare(b.dishId, undefined, { numeric: true })
          )
    );
  }, []);

  const handleLogin = useCallback((token, u) => {
    setAuth(token, u);
    setUser(u);
  }, []);

  const handleLogout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  // Apply + persist theme via the .dark class on <html>.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const load = useCallback(async () => {
    try {
      setStatus('loading');
      const data = await fetchDishes();
      data.sort((a, b) =>
        a.dishId.localeCompare(b.dishId, undefined, { numeric: true })
      );
      setDishes(data);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time wiring: react to changes from ANY source (dashboard or direct DB edit).
  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      load();
    };
    const onDisconnect = () => setConnected(false);

    const onDishUpdated = (updated) => {
      setDishes((prev) => {
        const exists = prev.some((d) => d.dishId === updated.dishId);
        if (exists) {
          return prev.map((d) => (d.dishId === updated.dishId ? updated : d));
        }
        return [...prev, updated].sort((a, b) =>
          a.dishId.localeCompare(b.dishId, undefined, { numeric: true })
        );
      });
    };

    const onResync = () => load();

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('dish:updated', onDishUpdated);
    socket.on('dishes:resync', onResync);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('dish:updated', onDishUpdated);
      socket.off('dishes:resync', onResync);
    };
  }, [load]);

  const setBusy = (dishId, value) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(dishId);
      else next.delete(dishId);
      return next;
    });
  };

  // Optimistic toggle with rollback on failure.
  const handleToggle = useCallback(async (dishId) => {
    setBusy(dishId, true);
    let nextState;
    setDishes((prev) =>
      prev.map((d) => {
        if (d.dishId === dishId) {
          nextState = !d.isPublished;
          return { ...d, isPublished: nextState };
        }
        return d;
      })
    );

    try {
      const updated = await toggleDish(dishId);
      setDishes((prev) => prev.map((d) => (d.dishId === dishId ? updated : d)));
      toast.success(
        `${updated.dishName} ${updated.isPublished ? 'published' : 'unpublished'}`
      );
    } catch (err) {
      setDishes((prev) =>
        prev.map((d) =>
          d.dishId === dishId ? { ...d, isPublished: !d.isPublished } : d
        )
      );
      if (err.status === 401) {
        clearAuth();
        setUser(null);
        toast.error('Session expired — please sign in again');
      } else if (err.status === 403) {
        toast.error('Read-only: your account cannot change dishes');
      } else {
        toast.error(`Could not update dish: ${err.message}`);
      }
    } finally {
      setBusy(dishId, false);
    }
  }, []);

  // Demo: trigger an out-of-band change; the UI updates via the socket, not here.
  const handleSimulate = useCallback(async () => {
    if (dishes.length === 0) return;
    const target = dishes[Math.floor(dishes.length / 2)];
    try {
      await simulateExternalChange(target.dishId);
      toast(`⚡ Backend changed "${target.dishName}" directly — watch it update live`);
    } catch (err) {
      toast.error(`Simulation failed: ${err.message}`);
    }
  }, [dishes]);

  const counts = useMemo(() => {
    const published = dishes.filter((d) => d.isPublished).length;
    return { published, total: dishes.length };
  }, [dishes]);

  const visibleDishes = useMemo(() => {
    return dishes.filter((d) => {
      if (filter === 'published' && !d.isPublished) return false;
      if (filter === 'unpublished' && d.isPublished) return false;
      if (debouncedQuery && !d.dishName.toLowerCase().includes(debouncedQuery)) {
        return false;
      }
      return true;
    });
  }, [dishes, filter, debouncedQuery]);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app bg-grid">
      <Toaster theme={theme} richColors position="bottom-right" closeButton />

      <header className="app-header bg-hero-glow">
        <div className="header-titles">
          <span className="eyebrow">METNMAT · Menu Management</span>
          <h1 className="font-display">
            <span className="text-brand-gradient">Dish Dashboard</span>
          </h1>
          <p className="subtitle">
            <b>{counts.published}</b> of <b>{counts.total}</b> dishes published
          </p>
        </div>
        <div className="header-actions">
          <span className={`conn ${connected ? 'conn-on' : 'conn-off'}`}>
            <span className="dot" />
            {connected ? 'Live' : 'Offline'}
          </span>
          <span className="user-chip" title={user.email}>
            <span className={`user-role role-${user.role}`}>{user.role}</span>
            <span className="user-email">{user.email}</span>
          </span>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle light / dark"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            type="search"
            placeholder="Search dishes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search dishes"
          />
        </div>

        <div className="segmented" role="tablist" aria-label="Filter dishes">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              className={`segment ${filter === f.key ? 'segment-active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {canEdit && (
          <button className="add-product-btn" onClick={() => setShowAdd(true)}>
            ＋ Add product
          </button>
        )}
        <button
          className="sim-btn"
          onClick={handleSimulate}
          title="Flip a dish directly in the database to demo real-time updates"
        >
          ⚡ Simulate backend change
        </button>
      </div>

      {showAdd && (
        <AddProductModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}

      {status === 'loading' && (
        <main className="grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </main>
      )}

      {status === 'error' && (
        <div className="state state-error">
          <p>Failed to load dishes: {error}</p>
          <button onClick={load}>Retry</button>
        </div>
      )}

      {status === 'ready' && dishes.length === 0 && (
        <p className="state">No dishes found. Did you run the seed script?</p>
      )}

      {status === 'ready' && dishes.length > 0 && visibleDishes.length === 0 && (
        <p className="state">No dishes match your search / filter.</p>
      )}

      {status === 'ready' && visibleDishes.length > 0 && (
        <main className="grid">
          {visibleDishes.map((dish) => (
            <DishCard
              key={dish.dishId}
              dish={dish}
              onToggle={handleToggle}
              busy={busyIds.has(dish.dishId)}
              canEdit={canEdit}
            />
          ))}
        </main>
      )}
    </div>
  );
}
