import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true },
  title: { type: String },
  image: { type: String },
  price: { type: Number },
  slug: { type: String },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  cartItems: [cartItemSchema],
}, { timestamps: true });

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
export default Cart;
