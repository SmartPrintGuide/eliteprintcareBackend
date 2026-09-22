import { NextResponse } from 'next/server';
import { connectDBWithRetry as connectDB, withDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import { authenticate } from '@/lib/auth';

const PUBLIC_CATALOG_CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET() {
  return withDB(async () => {  
    try {// Single aggregation pipeline instead of N+1 countDocuments queries.
      // This fires one MongoDB round-trip regardless of how many categories exist.
      const categories = await Category.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'productList',
          },
        },
        {
          $addFields: { count: { $size: '$productList' } },
        },
        {
          $project: { productList: 0 }, // drop the joined array, keep count
        },
      ]);
  
      return NextResponse.json(categories, {
        headers: { 'Cache-Control': PUBLIC_CATALOG_CACHE },
      });
    } catch (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    });
}

export async function POST(request) {
  return withDB(async () => {  
    try {const user = await authenticate(request);
      if (!user || !user.isAdmin)
        return NextResponse.json(
          { message: 'Not authorized as admin' },
          { status: 401, headers: NO_STORE }
        );
  
      const body = await request.json();
      const { name, slug, image, description } = body;
      if (!name)
        return NextResponse.json(
          { message: 'Category name is required' },
          { status: 400, headers: NO_STORE }
        );
  
      const generatedSlug =
        slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, '')
          .replace(/\s+/g, '-');
      const category = await Category.create({
        name,
        slug: generatedSlug,
        image,
        description,
      });
      return NextResponse.json(category, { status: 201, headers: NO_STORE });
    } catch (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
