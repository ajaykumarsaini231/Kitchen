import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:mm
    partySize: { type: Number, required: true, min: 1 },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'cancelled'],
      default: 'requested',
    },
  },
  { timestamps: true }
);

reservationSchema.methods.toClient = function toClient() {
  return {
    id: String(this._id),
    name: this.name,
    phone: this.phone,
    email: this.email,
    date: this.date,
    time: this.time,
    partySize: this.partySize,
    notes: this.notes,
    status: this.status,
    createdAt: this.createdAt,
  };
};

export const Reservation = mongoose.model('Reservation', reservationSchema);
