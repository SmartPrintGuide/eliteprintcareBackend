import { NextResponse } from 'next/server';
import { withDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { getUserFromRequest } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function PUT(request, { params }) {
  return withDB(async () => {  
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403, headers: NO_STORE }
      );
    }const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404, headers: NO_STORE }
      );
    }
  
    const body = await request.json();
    if (body.status) {
      order.status = body.status;
      await order.save();
      return NextResponse.json(order, { headers: NO_STORE });
    }
  
    return NextResponse.json(
      { message: 'Status is required' },
      { status: 400, headers: NO_STORE }
    );
    });
}
