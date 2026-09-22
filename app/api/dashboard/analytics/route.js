import { NextResponse } from 'next/server';
import { connectDBWithRetry as dbConnect, withDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';
import { authenticate } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request) {
  return withDB(async () => {  
    try {
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
      }const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59
      );
  
      const revenueResult = await Order.aggregate([
        { $match: { isPaid: true, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]);
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
  
      const currentMonthRevenue = await Order.aggregate([
        {
          $match: {
            isPaid: true,
            status: { $ne: 'Cancelled' },
            createdAt: { $gte: currentMonthStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]);
      const currentRevenue =
        currentMonthRevenue.length > 0 ? currentMonthRevenue[0].total : 0;
  
      const lastMonthRevenue = await Order.aggregate([
        {
          $match: {
            isPaid: true,
            status: { $ne: 'Cancelled' },
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]);
      const lastRevenue =
        lastMonthRevenue.length > 0 ? lastMonthRevenue[0].total : 0;
  
      const revenueGrowth =
        lastRevenue > 0
          ? Number((((currentRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1))
          : currentRevenue > 0
          ? 100
          : 0;
  
      const totalOrders = await Order.countDocuments();
      const currentMonthOrders = await Order.countDocuments({
        createdAt: { $gte: currentMonthStart },
      });
      const lastMonthOrders = await Order.countDocuments({
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      });
  
      const ordersGrowth =
        lastMonthOrders > 0
          ? Number(
              (((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100).toFixed(1)
            )
          : currentMonthOrders > 0
          ? 100
          : 0;
  
      const totalCustomers = await User.countDocuments({ isAdmin: false });
      const currentMonthCustomers = await User.countDocuments({
        isAdmin: false,
        createdAt: { $gte: currentMonthStart },
      });
      const lastMonthCustomers = await User.countDocuments({
        isAdmin: false,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      });
  
      const customersGrowth =
        lastMonthCustomers > 0
          ? Number(
              (
                ((currentMonthCustomers - lastMonthCustomers) / lastMonthCustomers) *
                100
              ).toFixed(1)
            )
          : currentMonthCustomers > 0
          ? 100
          : 0;
  
      const recentOrders = await Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id user totalPrice status isPaid createdAt');
  
      const ordersByStatus = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
  
      const activeStock = await Product.countDocuments({ countInStock: { $gt: 0 } });
  
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const revenueByMonth = await Order.aggregate([
        {
          $match: {
            isPaid: true,
            status: { $ne: 'Cancelled' },
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);
  
      return NextResponse.json(
        {
          revenue: {
            total: totalRevenue,
            currentMonth: currentRevenue,
            lastMonth: lastRevenue,
            growth: revenueGrowth,
          },
          orders: {
            total: totalOrders,
            currentMonth: currentMonthOrders,
            lastMonth: lastMonthOrders,
            growth: ordersGrowth,
          },
          customers: {
            total: totalCustomers,
            currentMonth: currentMonthCustomers,
            lastMonth: lastMonthCustomers,
            growth: customersGrowth,
          },
          activeStock,
          recentOrders,
          ordersByStatus,
          revenueByMonth,
        },
        { headers: NO_STORE }
      );
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      return NextResponse.json(
        { message: error.message || 'Failed to fetch analytics' },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
