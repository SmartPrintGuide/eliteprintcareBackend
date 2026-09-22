import { NextResponse } from 'next/server';
import { withDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { authenticate } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request, { params }) {
  return withDB(async () => {  
    const { productId } = await params;
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 401, headers: NO_STORE }
      );
    }if (user.isAdmin) {
      return NextResponse.json({ canReview: true }, { headers: NO_STORE });
    }
  
    const order = await Order.findOne({
      user: user._id,
      'orderItems.product': productId,
      isDelivered: true,
    });
  
    return NextResponse.json({ canReview: !!order }, { headers: NO_STORE });
    });
}
