import { NextResponse } from 'next/server';
import { connectDBWithRetry as connectDB, withDB } from '@/lib/db';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request) {
  return withDB(async () => {  
    try {const { email, otp } = await request.json();
      const trimmedEmail = email ? email.trim().toLowerCase() : '';
  
      if (!trimmedEmail || !otp) {
        return NextResponse.json(
          { message: 'Email and OTP are required' },
          { status: 400, headers: NO_STORE }
        );
      }
  
      const otpRecord = await OTP.findOne({ email: trimmedEmail, otp, type: 'registration' });
      if (!otpRecord) {
        console.error('OTP not found for email:', trimmedEmail);
        return NextResponse.json(
          { message: 'Invalid or expired OTP' },
          { status: 400, headers: NO_STORE }
        );
      }
  
      const existingUser = await User.findOne({ email: trimmedEmail });
      if (existingUser) {
        return NextResponse.json(
          { message: 'User already exists with this email' },
          { status: 400, headers: NO_STORE }
        );
      }
  
      const { registrationData } = otpRecord;
      if (
        !registrationData ||
        !registrationData.firstName ||
        !registrationData.lastName ||
        !registrationData.passwordHash
      ) {
        console.error('Invalid registration data:', registrationData);
        return NextResponse.json(
          { message: 'Registration data is incomplete or missing' },
          { status: 400, headers: NO_STORE }
        );
      }
  
      try {
        const user = await User.create({
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          name: `${registrationData.firstName} ${registrationData.lastName}`,
          email: trimmedEmail,
          password: registrationData.passwordHash,
        });
  
        await OTP.deleteOne({ _id: otpRecord._id });
  
        return NextResponse.json(
          { message: 'Account verified successfully. Please log in.', email: user.email },
          { status: 201, headers: NO_STORE }
        );
      } catch (createError) {
        console.error('Error creating user:', createError.message);
        return NextResponse.json(
          { message: 'Failed to create user: ' + createError.message },
          { status: 500, headers: NO_STORE }
        );
      }
    } catch (error) {
      console.error('OTP verification error:', error.message);
      return NextResponse.json(
        { message: error.message },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
