import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'online',
      service: 'Elite Print Care Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: {
          login: 'POST /api/auth/login',
          profile: 'GET, PUT /api/auth/profile',
          forgotPassword: 'POST /api/auth/forgot-password',
          resetPassword: 'POST /api/auth/reset-password',
          sendRegistrationOtp: 'POST /api/auth/send-registration-otp',
          verifyRegistrationOtp: 'POST /api/auth/verify-registration-otp',
        },
        cart: 'GET, POST /api/cart, DELETE /api/cart/[productId]',
        categories: 'GET, POST /api/categories, GET, PUT, DELETE /api/categories/[id]',
        products: 'GET, POST /api/products, GET, PUT, DELETE /api/products/[id]',
        orders: {
          base: 'GET, POST /api/orders, GET /api/orders/[id]',
          myOrders: 'GET /api/orders/myorders',
          status: 'PUT /api/orders/[id]/status',
          pay: 'POST /api/orders/[id]/pay',
          cloverPay: 'POST /api/orders/clover/pay',
          reviewEligibility: 'GET /api/orders/check-review-eligibility/[productId]',
        },
        chats: {
          base: 'GET, POST /api/chats',
          myChats: 'GET /api/chats/my',
          byId: 'GET, DELETE /api/chats/[id]',
          messages: 'POST /api/chats/[id]/messages',
          read: 'PUT /api/chats/[id]/read',
          close: 'PUT /api/chats/[id]/close',
        },
        shipping: 'POST /api/shipping/rates',
        contact: 'POST /api/contact',
        dashboard: 'GET /api/dashboard/analytics',
        settings: 'GET, PUT /api/smart-printer-setup/settings',
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
