import { NextResponse } from 'next/server';
import { connectDBWithRetry as dbConnect, withDB } from '@/lib/db';
import Cart from '@/lib/models/Cart';
import Product from '@/lib/models/Product';
import { getUserFromRequest } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request) {
  return withDB(async () => {  
    const user = await getUserFromRequest(request);const cart = await Cart.findOne({ user: user._id });
    return NextResponse.json(cart ? cart.cartItems : [], { headers: NO_STORE });
    });
}

export async function POST(request) {
  return withDB(async () => {  
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { product, qty } = body;
    if (!product || !qty) {
      return NextResponse.json(
        { message: 'Product and qty required' },
        { status: 400, headers: NO_STORE }
      );
    }let cart = await Cart.findOne({ user: user._id });
    const prod = await Product.findById(product);
    if (!prod) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404, headers: NO_STORE }
      );
    }
  
    const item = {
      product: prod._id,
      qty,
      title: prod.title,
      image: prod.images?.length > 0 ? prod.images[0] : '',
      price: prod.price,
      slug: prod.slug,
    };
  
    if (!cart) {
      cart = new Cart({ user: user._id, cartItems: [item] });
    } else {
      const existIdx = cart.cartItems.findIndex(
        (x) => x.product.toString() === product
      );
      if (existIdx > -1) {
        cart.cartItems[existIdx] = item;
      } else {
        cart.cartItems.push(item);
      }
    }
  
    await cart.save();
    return NextResponse.json(cart.cartItems, { headers: NO_STORE });
    });
}

export async function DELETE(request) {
  return withDB(async () => {  
    const user = await getUserFromRequest(request);const cart = await Cart.findOne({ user: user._id });
    if (cart) {
      cart.cartItems = [];
      await cart.save();
    }
    return NextResponse.json([], { headers: NO_STORE });
    });
}
