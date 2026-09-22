import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/lib/models/Chat';
import { authenticate } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function PUT(request, { params }) {
  return withDB(async () => {  
    try {
      const { id } = await params;
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
      }const chat = await Chat.findById(id);
      if (!chat) {
        return NextResponse.json(
          { message: 'Chat not found' },
          { status: 404, headers: NO_STORE }
        );
      }
  
      chat.messages.forEach((msg) => {
        msg.isRead = true;
      });
      chat.unreadCount = 0;
      await chat.save();
  
      return NextResponse.json(
        { message: 'Messages marked as read' },
        { headers: NO_STORE }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return NextResponse.json(
        { message: error.message || 'Failed to mark messages as read' },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
