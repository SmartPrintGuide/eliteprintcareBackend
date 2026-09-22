import { NextResponse } from 'next/server';
import axios from 'axios';
import { connectDBWithRetry as dbConnect, withDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import { authenticate } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request) {
  return withDB(async () => {  
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 401, headers: NO_STORE }
      );
    }
  
    const body = await request.json();
    const { amount, orderId, source } = body;
    if (!amount || !orderId || !source) {
      return NextResponse.json(
        { message: 'Missing payment data' },
        { status: 400, headers: NO_STORE }
      );
    }
  
    // Use CLOVER_ENV instead of NODE_ENV.
    // NODE_ENV is not reliably set in Cloudflare Workers; CLOVER_ENV is an
    // explicit secret we control and is already present in .dev.vars.
    const cloverEnv = process.env.CLOVER_ENV ?? 'sandbox';
    const cloverUrl =
      cloverEnv === 'production'
        ? 'https://api.clover.com/v1/charges'
        : 'https://sandbox.dev.clover.com/v1/charges';
  
    try {
      const response = await axios.post(
        cloverUrl,
        {
          amount: Math.round(amount * 100),
          currency: 'USD',
          source,
          metadata: { orderId },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CLOVER_PRIVATE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (!response.data || !response.data.id) {
        return NextResponse.json(
          { message: 'Clover payment failed' },
          { status: 400, headers: NO_STORE }
        );
      }const order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json(
          { message: 'Order not found' },
          { status: 404, headers: NO_STORE }
        );
      }
  
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentResult = {
        id: response.data.id,
        status: response.data.status,
      };
      await order.save();
  
      return NextResponse.json(
        { success: true, message: 'Payment successful', payment: response.data },
        { headers: NO_STORE }
      );
    } catch (error) {
      const cloverErr = error.response?.data;
      let reason = 'Payment failed';
      if (cloverErr?.error?.message) {
        reason = cloverErr.error.message;
      } else if (cloverErr?.message) {
        reason = cloverErr.message;
      } else if (error.message) {
        reason = error.message;
      }
      return NextResponse.json(
        { message: `Payment failed: ${reason}` },
        { status: 400, headers: NO_STORE }
      );
    }
    });
}
