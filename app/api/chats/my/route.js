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
      }let chat = await Chat.findOne({ user: user._id }).populate(
        'user',
        'name email avatar'
      );
      if (!chat) {
        chat = await Chat.create({ user: user._id, messages: [], status: 'active' });
        chat = await Chat.findById(chat._id).populate('user', 'name email avatar');
      }
      return NextResponse.json(chat, { headers: NO_STORE });
    } catch (error) {
      console.error('Error fetching user chat:', error);
      return NextResponse.json(
        { message: error.message || 'Failed to fetch chat' },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
