import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDBWithRetry as connectDB, withDB } from '@/lib/db';
import User from '@/lib/models/User';

// Cache-Control: no-store prevents the Cloudflare edge (and any CDN / browser)
// from caching the login response, which contains a JWT token.
const NO_STORE = { 'Cache-Control': 'no-store' };

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

export async function POST(request) {
  return withDB(async () => {  
    try {const { email, password, isAdminLogin } = await request.json();
      const trimmedEmail = email ? email.trim().toLowerCase() : '';
  
      const user = await User.findOne({ email: trimmedEmail });
  
      if (user && (await user.matchPassword(password))) {
        if (user.isBlocked) {
          return NextResponse.json(
            { message: 'Your account has been blocked by admin. Please contact support.' },
            { status: 403, headers: NO_STORE }
          );
        }
  
        if (!isAdminLogin && user.isAdmin) {
          return NextResponse.json(
            { message: 'You are not our user' },
            { status: 401, headers: NO_STORE }
          );
        }
  
        if (isAdminLogin && !user.isAdmin) {
          return NextResponse.json(
            { message: 'Not authorized as an admin' },
            { status: 401, headers: NO_STORE }
          );
        }
  
        return NextResponse.json(
          {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
          },
          { headers: NO_STORE }
        );
      }
  
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401, headers: NO_STORE }
      );
    } catch (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
