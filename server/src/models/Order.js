import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    dishId: { type: String, required: true },
    dishName: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: { type: [itemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    orderType: {
      type: String,
      enum: ['delivery', 'pickup', 'dine-in'],
      default: 'delivery',
    },
    paymentMethod: { type: String, enum: ['cod', 'demo-card'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    status: {
      type: String,
      enum: ['placed', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'placed',
    },
  },
  { timestamps: true }
);

orderSchema.methods.toClient = function toClient() {
  return {
    orderNumber: this.orderNumber,
    items: this.items,
    subtotal: this.subtotal,
    tax: this.tax,
    deliveryFee: this.deliveryFee,
    total: this.total,
    customer: this.customer,
    orderType: this.orderType,
    paymentMethod: this.paymentMethod,
    paymentStatus: this.paymentStatus,
    status: this.status,
    createdAt: this.createdAt,
  };
};

export const Order = mongoose.model('Order', orderSchema);
