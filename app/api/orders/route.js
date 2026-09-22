import { NextResponse } from 'next/server';
import { connectDBWithRetry as dbConnect, withDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import Cart from '@/lib/models/Cart';
import { getUserFromRequest } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request) {
  return withDB(async () => {  
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 401, headers: NO_STORE }
      );
    }if (user.isAdmin) {
      const url = new URL(request.url);
      const search = url.searchParams.get('search') || '';
      const page = Number(url.searchParams.get('page') || 1);
      const pageSize = Number(url.searchParams.get('limit') || 20);
  
      const query = search
        ? {
            $or: [
              { status: { $regex: search, $options: 'i' } },
              { 'shippingAddress.address': { $regex: search, $options: 'i' } },
              { 'shippingAddress.city': { $regex: search, $options: 'i' } },
              { 'shippingAddress.postalCode': { $regex: search, $options: 'i' } },
              { 'shippingAddress.country': { $regex: search, $options: 'i' } },
            ],
          }
        : {};
  
      const count = await Order.countDocuments(query);
      const orders = await Order.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));
  
      return NextResponse.json(
        { orders, page, pages: Math.ceil(count / pageSize), total: count },
        { headers: NO_STORE }
      );
    }
  
    const orders = await Order.find({ user: user._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    return NextResponse.json(orders, { headers: NO_STORE });
    });
}

export async function POST(request) {
  return withDB(async () => {  
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 401, headers: NO_STORE }
      );
    }
  
    const body = await request.json();
    const {
      cartItems: rawCartItems,
      orderItems: rawOrderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
    } = body;
  
    const cartItems = rawCartItems || rawOrderItems || [];
  
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { message: 'No order items' },
        { status: 400, headers: NO_STORE }
      );
    }const orderItems = await Promise.all(
      cartItems.map(async (item) => {
        const productId = item.product || item._id || item.productId || null;
        let product = null;
        if (productId) {
          product = await Product.findById(productId);
        } else if (item.slug) {
          product = await Product.findOne({ slug: item.slug });
        }
  
        return {
          name: item.name || item.title || product?.name || product?.title || 'Unnamed Product',
          qty: item.qty || item.quantity || 1,
          image: item.image || item.images?.[0] || '',
          price: item.price ?? item.unitPrice ?? 0,
          product: product?._id || productId,
        };
      })
    );
  
    const order = new Order({
      user: user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
    });
  
    await order.save();
    await Cart.findOneAndUpdate({ user: user._id }, { cartItems: [] });
  
    return NextResponse.json(order, { headers: NO_STORE });
    });
}
