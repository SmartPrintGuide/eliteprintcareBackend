import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/lib/models/Order';
import { getUserFromRequest } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request, { params }) {
  return withDB(async () => {  
    const { id } = await params;
    const user = await getUserFromRequest(request);const order = await Order.findById(id).populate('user', 'name email');
    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404, headers: NO_STORE }
      );
    }
    if (order.user._id.toString() !== user._id.toString() && !user.isAdmin) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403, headers: NO_STORE }
      );
    }
    return NextResponse.json(order, { headers: NO_STORE });
    });
}

export async function PUT(request, { params }) {
  return withDB(async () => {  
    const { id } = await params;
    const user = await getUserFromRequest(request);const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { message: 'Order not found' },
        { status: 404, headers: NO_STORE }
      );
    }
    if (order.user.toString() !== user._id.toString() && !user.isAdmin) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403, headers: NO_STORE }
      );
    }
  
    const body = await request.json();
    if (body.isPaid !== undefined) {
      order.isPaid = body.isPaid;
      order.paidAt = new Date();
    }
    if (body.status) {
      order.status = body.status;
    }
  
    await order.save();
    return NextResponse.json(order, { headers: NO_STORE });
    });
}
