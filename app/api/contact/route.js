import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/emailService';

const NO_STORE = { 'Cache-Control': 'no-store' };

// contact route does NOT use MongoDB — no withDB wrapper needed.
export async function POST(request) {
  try {
    const body = await request.json();
    const type = body.type;

    let subject = '';
    let html = '';
    let text = '';
    let fromName = '';
    let replyToEmail = '';

    if (type === 'return-exchange') {
      const {
        fullName, email, phone, orderNumber, orderDate,
        deliveryDate, productName, reason, itemCondition,
        resolution, additionalDetails,
      } = body;

      if (!fullName || !email || !orderNumber) {
        return NextResponse.json(
          { message: 'Please fill in all required fields' },
          { status: 400, headers: NO_STORE }
        );
      }

      fromName = fullName;
      replyToEmail = email;
      subject = `Return/Exchange Request: Order #${orderNumber} from ${fullName}`;
      text = `Return/Exchange Request\n\nCustomer Information:\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\nOrder Information:\nOrder Number: ${orderNumber}\nOrder Date: ${orderDate}\nDelivery Date: ${deliveryDate}\n\nProduct Details:\nProduct Name: ${productName || 'N/A'}\nReason: ${reason || 'N/A'}\nItem Condition: ${itemCondition || 'N/A'}\n\nResolution Requested: ${resolution || 'N/A'}\n\nAdditional Details:\n${additionalDetails || 'N/A'}`;
      html = `<h3>New Return/Exchange Request</h3><h4>Customer Information</h4><p><strong>Name:</strong> ${fullName}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><h4>Order Information</h4><p><strong>Order Number:</strong> ${orderNumber}</p><p><strong>Order Date:</strong> ${orderDate}</p><p><strong>Delivery Date:</strong> ${deliveryDate}</p><h4>Product Details</h4><p><strong>Product Name:</strong> ${productName || 'N/A'}</p><p><strong>Reason:</strong> ${reason || 'N/A'}</p><p><strong>Item Condition:</strong> ${itemCondition || 'N/A'}</p><h4>Resolution Requested</h4><p><strong>${resolution || 'N/A'}</strong></p><h4>Additional Details</h4><p>${(additionalDetails || 'N/A').replace(/\n/g, '<br>')}</p>`;
    } else {
      const { name, email, orderNumber, subject: reqSubject, message } = body;
      if (!name || !email || !reqSubject || !message) {
        return NextResponse.json(
          { message: 'Please fill in all required fields' },
          { status: 400, headers: NO_STORE }
        );
      }
      fromName = name;
      replyToEmail = email;
      subject = `Contact Form: ${reqSubject} from ${name}`;
      text = `Name: ${name}\nEmail: ${email}\nOrder Number: ${orderNumber || 'N/A'}\nSubject: ${reqSubject}\n\nMessage:\n${message}`;
      html = `<h3>New Contact Form Submission</h3><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Order Number:</strong> ${orderNumber || 'N/A'}</p><p><strong>Subject:</strong> ${reqSubject}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`;
    }

    await sendEmail({
      to: process.env.CONTACT_RECEIVER_EMAIL || 'support@eliteprintcare.com',
      subject, html, text,
      from: `"${fromName}" <${process.env.EMAIL_FROM || 'no-reply@eliteprintcare.com'}>`,
      replyTo: replyToEmail,
    });

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { headers: NO_STORE }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to send email. Please try again later.' },
      { status: 500, headers: NO_STORE }
    );
  }
}
