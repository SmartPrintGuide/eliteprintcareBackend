import { NextResponse } from 'next/server';
import { connectDBWithRetry as connectDB, withDB } from '@/lib/db';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import { generateOTP, sendOTPEmail } from '@/lib/emailService';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request) {
  return withDB(async () => {  
    try {const { email } = await request.json();
      const trimmedEmail = email ? email.trim().toLowerCase() : '';
  
      const user = await User.findOne({ email: trimmedEmail });
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404, headers: NO_STORE }
        );
      }
  
      const otp = generateOTP();
      await sendOTPEmail(trimmedEmail, otp, 'password-reset');
  
      await OTP.findOneAndDelete({ email: trimmedEmail, type: 'reset' });
      await OTP.create({ email: trimmedEmail, otp, type: 'reset' });
  
      return NextResponse.json(
        { message: 'Password reset OTP sent to your email' },
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
