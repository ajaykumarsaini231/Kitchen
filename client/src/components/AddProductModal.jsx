import { useState } from 'react';
import { toast } from 'sonner';
import { createDish } from '../api.js';

export default function AddProductModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    dishName: '',
    price: '',
    imageUrl: '',
    description: '',
    isPublished: true,
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.dishName.trim()) return;
    setBusy(true);
    try {
      const dish = await createDish({
        dishName: form.dishName.trim(),
        price: Number(form.price) || 0,
        imageUrl: form.imageUrl.trim(),
        description: form.description.trim(),
        isPublished: form.isPublished,
      });
      toast.success(`Added "${dish.dishName}"`);
      onCreated?.(dish);
      onClose();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 className="font-display modal-title">Add a dish</h2>

        <label className="field">
          <span>Dish name *</span>
          <input value={form.dishName} onChange={set('dishName')} required autoFocus />
        </label>
        <label className="field">
          <span>Price (₹) *</span>
          <input type="number" min="0" value={form.price} onChange={set('price')} required />
        </label>
        <label className="field">
          <span>Image URL (optional)</span>
          <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" />
        </label>
        <label className="field">
          <span>Description (optional)</span>
          <input
            value={form.description}
            onChange={set('description')}
            placeholder="Short, appetizing description"
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
          />
          Publish immediately
        </label>

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="login-btn" style={{ margin: 0, width: 'auto' }} disabled={busy}>
            {busy ? 'Adding…' : 'Add dish'}
          </button>
        </div>
      </form>
    </div>
  );
}
