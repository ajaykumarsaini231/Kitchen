import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema(
  {
    // Business identifier from the seed data (unique, separate from Mongo's _id).
    dishId: { type: String, required: true, unique: true, index: true },
    dishName: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    isPublished: { type: Boolean, default: false },
    price: { type: Number, default: 0, min: 0 },
    // Soft delete: non-null means the dish is hidden from normal queries.
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

// Shape sent to clients: stable, no Mongo internals.
dishSchema.methods.toClient = function toClient() {
  return {
    dishId: this.dishId,
    dishName: this.dishName,
    imageUrl: this.imageUrl,
    description: this.description,
    isPublished: this.isPublished,
    price: this.price,
  };
};

export const Dish = mongoose.model('Dish', dishSchema);

// Plain-object version used when documents come from change streams / lean queries.
export function toClientDoc(doc) {
  if (!doc) return null;
  return {
    dishId: doc.dishId,
    dishName: doc.dishName,
    imageUrl: doc.imageUrl,
    description: doc.description,
    isPublished: doc.isPublished,
    price: doc.price,
  };
}
