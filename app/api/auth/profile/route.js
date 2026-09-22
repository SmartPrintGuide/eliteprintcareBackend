import { NextResponse } from 'next/server';
import { connectDBWithRetry as connectDB, withDB } from '@/lib/db';
import User from '@/lib/models/User';
import { authenticate } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const NO_STORE = { 'Cache-Control': 'no-store' };

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

export async function GET(request) {
  return withDB(async () => {  
    try {const user = await authenticate(request);
      if (!user)
        return NextResponse.json(
          { message: 'Not authorized' },
          { status: 401, headers: NO_STORE }
        );
  
      return NextResponse.json(
        {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        },
        { headers: NO_STORE }
      );
    } catch (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}

export async function PUT(request) {
  return withDB(async () => {  
    try {const user = await authenticate(request);
      if (!user)
        return NextResponse.json(
          { message: 'Not authorized' },
          { status: 401, headers: NO_STORE }
        );
  
      const body = await request.json();
      const dbUser = await User.findById(user._id);
      if (!dbUser)
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404, headers: NO_STORE }
        );
  
      dbUser.firstName = body.firstName || dbUser.firstName;
      dbUser.lastName = body.lastName || dbUser.lastName;
      dbUser.name = `${dbUser.firstName} ${dbUser.lastName}`;
      dbUser.email = body.email || dbUser.email;
      if (body.password) dbUser.password = body.password;
  
      const updatedUser = await dbUser.save();
  
      return NextResponse.json(
        {
          _id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          token: generateToken(updatedUser._id),
        },
        { headers: NO_STORE }
      );
    } catch (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
