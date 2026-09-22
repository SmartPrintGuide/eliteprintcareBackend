import { NextResponse } from 'next/server';
import { withDB } from '@/lib/db';
import Chat from '@/lib/models/Chat';
import { authenticate } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request, { params }) {
  return withDB(async () => {  
    try {
      const { id } = await params;
      const user = await authenticate(request);
      if (!user) {
        return NextResponse.json(
          { message: 'Not authorized' },
          { status: 401, headers: NO_STORE }
        );
      }const chat = await Chat.findById(id).populate('user', 'name email avatar');
      if (!chat) {
        return NextResponse.json(
          { message: 'Chat not found' },
          { status: 404, headers: NO_STORE }
        );
      }
  
      if (chat.user._id.toString() !== user._id.toString() && !user.isAdmin) {
        return NextResponse.json(
          { message: 'Not authorized to access this chat' },
          { status: 403, headers: NO_STORE }
        );
      }
  
      return NextResponse.json(chat, { headers: NO_STORE });
    } catch (error) {
      console.error('Error fetching chat:', error);
      return NextResponse.json(
        { message: error.message || 'Failed to fetch chat' },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
