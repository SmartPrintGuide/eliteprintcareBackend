import { NextResponse } from 'next/server';
import { withDB } from '@/lib/db';
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

    await request.json(); // consume body

    return NextResponse.json(
      {
        rates: [
          {
            id: 'free-delivery',
            service: 'Free Delivery',
            carrier: 'Elite Print Care',
            rate: '0.00',
            currency: 'USD',
            delivery_days: 'Standard',
          },
        ],
        distance: null,
      },
      { headers: NO_STORE }
    );
  });
}
