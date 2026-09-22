import nodemailer from 'nodemailer';

let testAccount = null;
let transporter = null;

const createTestAccount = async () => {
  testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const initializeTransporter = async () => {
  if (process.env.EMAIL_SERVICE === 'ethereal') {
    if (!testAccount) await createTestAccount();
  } else if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const isSecure = process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT == 465;
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: isSecure,
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });
  } else {
    transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 1,
      maxMessages: 5,
      rateDelta: 2000,
      rateLimit: 1,
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });
  }
};

const sendEmail = async ({ to, subject, html, text, from, replyTo }) => {
  try {
    if (!transporter) await initializeTransporter();

    const mailOptions = {
      from: from || `"Elite Print Care" <${process.env.EMAIL_FROM || 'no-reply@eliteprintcare.com'}>`,

      to,
      subject,
      html,
      text,
      replyTo,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp, type = 'registration') => {
  const subject = type === 'registration'
    ? 'Verify Your Account - Elite Print Care'
    : 'Reset Your Password - Elite Print Care';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Elite Print Care</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">${type === 'registration' ? 'Account Verification' : 'Password Reset'}</p>
      </div>
      <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">${type === 'registration' ? 'Verify Your Account' : 'Reset Your Password'}</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello!</p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">${type === 'registration' ? 'Thank you for registering with Elite Print Care. Your OTP code is:' : 'We received a request to reset your password. Your OTP code is:'}</p>
        <div style="background-color: #f8f9fa; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px; margin-bottom: 30px;">This code will expire in <strong>10 minutes</strong>. Please use it to ${type === 'registration' ? 'verify your account' : 'reset your password'}.</p>
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="color: #856404; margin: 0; font-size: 14px;"><strong>Security Notice:</strong> If you didn't request this, please ignore this email. Your account remains secure.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message from Elite Print Care. Please do not reply to this email.</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    from: `"Elite Print Care" <${process.env.OTP_FROM_EMAIL || 'no-reply@eliteprintcare.com'}>`,
  });
};

export { sendEmail, generateOTP, sendOTPEmail };
