import { NextResponse } from 'next/server';
import { connectDBWithRetry as dbConnect, withDB } from '@/lib/db';
import Chat from '@/lib/models/Chat';
import { authenticate } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request) {
  return withDB(async () => {  
    try {
      const user = await authenticate(request);
      if (!user) {
        return NextResponse.json(
          { message: 'Not authorized' },
          { status: 401, headers: NO_STORE }
        );
      }
      if (!user.isAdmin) {
        return NextResponse.json(
          { message: 'Not authorized' },
          { status: 403, headers: NO_STORE }
        );
      }const chats = await Chat.find()
        .populate('user', 'name email avatar')
        .sort({ updatedAt: -1 });
      return NextResponse.json(chats, { headers: NO_STORE });
    } catch (error) {
      console.error('Error fetching chats:', error);
      return NextResponse.json(
        { message: error.message || 'Failed to fetch chats' },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
