import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String },
  rating: { type: Number, required: true, default: 5 },
  comment: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  brand: { type: String, required: true },
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category' },
  description: { type: String },
  price: { type: Number, required: true, default: 0 },
  oldPrice: { type: Number, default: 0 },
  countInStock: { type: Number, required: true, default: 0 },
  shortDetails: { type: String },
  shortSpecification: { type: String },
  overview: { type: String },
  technicalSpecification: { type: String },
  color: { type: String },
  width: { type: String },
  height: { type: String },
  depth: { type: String },
  screenSize: { type: String },
  rating: { type: Number, required: true, default: 0 },
  numReviews: { type: Number, required: true, default: 0 },
  reviews: [reviewSchema],
  images: [String],
  sales: { type: Number, default: 0 },
  technology: { type: [String], enum: ['Inkjet', 'Laser', 'Laser (B/W)'], default: [] },
  usageCategory: { type: [String], enum: ['Home', 'Office', 'Mobile', 'Photo'], default: [] },
  allInOneType: { type: [String], enum: ['Multifunction', 'Single Function'], default: [] },
  wireless: { type: String, enum: ['Yes', 'No', ''], default: '' },
  mainFunction: { type: [String], enum: ['Print', 'Scan', 'Copy', 'Fax', 'Print Only'], default: [] },
}, { timestamps: true });

productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ usageCategory: 1 });
productSchema.index({ technology: 1 });
productSchema.index({ title: 'text', brand: 'text', description: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
