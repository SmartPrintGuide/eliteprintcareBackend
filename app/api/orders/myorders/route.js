import { NextResponse } from 'next/server';
import { connectDBWithRetry as dbConnect, withDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { getUserFromRequest } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request) {
  return withDB(async () => {  
    try {
      const user = await getUserFromRequest(request);
      if (!user) {
        return NextResponse.json(
          { message: 'Not authorized' },
          { status: 401, headers: NO_STORE }
        );
      }const orders = await Order.find({ user: user._id })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
      return NextResponse.json(orders, { headers: NO_STORE });
    } catch (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
