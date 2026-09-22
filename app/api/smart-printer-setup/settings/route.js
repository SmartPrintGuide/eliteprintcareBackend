import { NextResponse } from 'next/server';
import { connectDBWithRetry as connectDB, withDB } from '@/lib/db';
import SiteSettings from '@/lib/models/SiteSettings';

const NO_STORE = { 'Cache-Control': 'no-store' };

// GET /api/smart-printer-setup/settings
// Public — returns current chatEnabled state
export async function GET() {
  return withDB(async () => {  
    try {
  let settings = await SiteSettings.findOne({ key: 'global' });
      if (!settings) {
        settings = await SiteSettings.create({ key: 'global', chatEnabled: true });
      }
  
      return NextResponse.json({ chatEnabled: settings.chatEnabled }, { headers: NO_STORE });
    } catch (error) {
      console.error('[settings GET]', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}

// POST /api/smart-printer-setup/settings
// Protected — validates admin credentials then updates chatEnabled
export async function POST(request) {
  return withDB(async () => {  
    try {
      const body = await request.json();
      const { username, password, chatEnabled } = body;
  
      const validUsername = process.env.ADMIN_USERNAME;
      const validPassword = process.env.ADMIN_PASSWORD;
  
      if (!validUsername || !validPassword) {
        return NextResponse.json(
          { error: 'Admin credentials are not configured on the server.' },
          { status: 500, headers: NO_STORE }
        );
      }
  
      if (username !== validUsername || password !== validPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401, headers: NO_STORE }
        );
      }
  
      if (typeof chatEnabled !== 'boolean') {
        return NextResponse.json(
          { error: 'chatEnabled must be a boolean' },
          { status: 400, headers: NO_STORE }
        );
      }
  const settings = await SiteSettings.findOneAndUpdate(
        { key: 'global' },
        { chatEnabled },
        { upsert: true, new: true }
      );
  
      return NextResponse.json({ chatEnabled: settings.chatEnabled }, { headers: NO_STORE });
    } catch (error) {
      console.error('[settings POST]', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
