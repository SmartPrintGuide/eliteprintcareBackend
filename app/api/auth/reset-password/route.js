import { NextResponse } from 'next/server';
import { connectDBWithRetry as connectDB, withDB } from '@/lib/db';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request) {
  return withDB(async () => {  
    try {const { email, otp, newPassword } = await request.json();
      const trimmedEmail = email ? email.trim().toLowerCase() : '';
  
      const otpRecord = await OTP.findOne({ email: trimmedEmail, otp, type: 'reset' });
      if (!otpRecord) {
        return NextResponse.json(
          { message: 'Invalid or expired OTP' },
          { status: 400, headers: NO_STORE }
        );
      }
  
      const user = await User.findOne({ email: trimmedEmail });
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404, headers: NO_STORE }
        );
      }
  
      user.password = newPassword;
      await user.save();
      await OTP.deleteOne({ _id: otpRecord._id });
  
      return NextResponse.json(
        { message: 'Password reset successfully' },
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
