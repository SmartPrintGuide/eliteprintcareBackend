import { NextResponse } from 'next/server';
import { connectDBWithRetry as connectDB, withDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import { authenticate } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

const PUBLIC_CATALOG_CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadFileToCloudinary(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'products',
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

async function parseRequestBody(request) {
  const contentType = request.headers.get('content-type') || '';
  const preserveEmptyStrings = request.method === 'PUT';

  if (contentType.includes('application/json')) {
    return await request.json();
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const body = {};

    for (const [key, value] of formData.entries()) {
      if (key === 'existingImages' || key === 'reviews') {
        if (typeof value === 'string') {
          try {
            body[key] = JSON.parse(value);
          } catch {
            body[key] = value.split(',').map(item => item.trim()).filter(Boolean);
          }
        } else {
          body[key] = value;
        }
      } else if (key === 'images') {
        if (!body.images) body.images = [];
        const isFile = value && typeof value === 'object' && typeof value.arrayBuffer === 'function';
        if (isFile) {
          const url = await uploadFileToCloudinary(value);
          body.images.push(url);
        } else {
          body.images.push(value);
        }
      } else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          body[key] = JSON.parse(value);
        } catch {
          body[key] = value;
        }
      } else if (typeof value === 'string' && value.includes(',') && ['technology', 'usageCategory', 'allInOneType', 'mainFunction'].includes(key)) {
        body[key] = value.split(',').map(item => item.trim()).filter(Boolean);
      } else {
        body[key] = value;
      }
    }

    if (body.existingImages) {
      const existingImages = Array.isArray(body.existingImages) ? body.existingImages : [body.existingImages];
      const uploadedImages = Array.isArray(body.images) ? body.images : [];
      body.images = [...existingImages, ...uploadedImages];
      delete body.existingImages;
    }

    const optionalEmptyArrays = ['technology', 'usageCategory', 'allInOneType', 'mainFunction'];
    const optionalEmptyStrings = ['wireless'];

    optionalEmptyArrays.forEach(key => {
      if (Array.isArray(body[key]) && body[key].length === 0) {
        delete body[key];
      }
    });

    optionalEmptyStrings.forEach(key => {
      if (body[key] === '' && !preserveEmptyStrings) {
        delete body[key];
      }
    });

    return body;
  }

  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function GET(request) {
  return withDB(async () => {  
    try {const { searchParams } = new URL(request.url);
      const search = searchParams.get('search') || '';
      const category = searchParams.get('category');
      const pageSize = Number(searchParams.get('limit')) || 20;
      const page = Number(searchParams.get('page')) || 1;
      const sort = searchParams.get('sort');
      const brand = searchParams.get('brand');
      const technology = searchParams.get('technology');
      const usageCategory = searchParams.get('usageCategory');
      const allInOneType = searchParams.get('allInOneType');
      const wireless = searchParams.get('wireless');
      const mainFunction = searchParams.get('mainFunction');
  
      const query = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { shortDetails: { $regex: search, $options: 'i' } },
          { shortSpecification: { $regex: search, $options: 'i' } },
          { overview: { $regex: search, $options: 'i' } },
          { technicalSpecification: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { color: { $regex: search, $options: 'i' } },
        ];
      }
  
      if (category) {
        const categoryPattern = new RegExp(
          `^${category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        );
        const categoryDoc = await Category.findOne({
          $or: [
            { slug: category.trim().toLowerCase() },
            { name: categoryPattern },
          ],
        });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          return NextResponse.json(
            { products: [], page: 1, pages: 0, total: 0 },
            { headers: { 'Cache-Control': PUBLIC_CATALOG_CACHE } }
          );
        }
      }
  
      if (brand) {
        query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
      }
  
      if (technology) {
        query.technology = { $in: technology.split(',').map(t => t.trim()) };
      }
  
      if (usageCategory) {
        query.usageCategory = { $in: usageCategory.split(',').map(u => u.trim()) };
      }
  
      if (allInOneType) {
        query.allInOneType = { $in: allInOneType.split(',').map(a => a.trim()) };
      }
  
      if (wireless) {
        query.wireless = { $regex: new RegExp(`^${wireless}$`, 'i') };
      }
  
      if (mainFunction) {
        query.mainFunction = { $in: mainFunction.split(',').map(m => m.trim()) };
      }
  
      let sortOption = {};
      if (sort === 'lowToHigh') {
        sortOption.price = 1;
      } else if (sort === 'highToLow') {
        sortOption.price = -1;
      }
  
      const count = await Product.countDocuments(query);
      const products = await Product.find(query)
        .populate({ path: 'category', select: 'name' })
        .sort(sortOption)
        .limit(pageSize)
        .skip(pageSize * (page - 1));
  
      return NextResponse.json(
        { products, page, pages: Math.ceil(count / pageSize), total: count },
        { headers: { 'Cache-Control': PUBLIC_CATALOG_CACHE } }
      );
    } catch (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    });
}

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request) {
  return withDB(async () => {  
    try {const user = await authenticate(request);
      if (!user || !user.isAdmin)
        return NextResponse.json(
          { message: 'Not authorized as admin' },
          { status: 401, headers: NO_STORE }
        );
  
      const data = await parseRequestBody(request);
      const product = await Product.create({ ...data, user: user._id });
      return NextResponse.json(product, { status: 201, headers: NO_STORE });
    } catch (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500, headers: NO_STORE }
      );
    }
    });
}
