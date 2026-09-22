import { NextResponse } from 'next/server';
import { withDB } from '@/lib/db';
import Cart from '@/lib/models/Cart';
import { getUserFromRequest } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function DELETE(request, { params }) {
  return withDB(async () => {  
    const { productId } = await params;
    const user = await getUserFromRequest(request);const cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      return NextResponse.json([], { headers: NO_STORE });
    }
  
    cart.cartItems = cart.cartItems.filter(
      (x) => x.product.toString() !== productId
    );
    await cart.save();
    return NextResponse.json(cart.cartItems, { headers: NO_STORE });
    });
}
