import { NextResponse } from 'next/server';
import { withDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import { authenticate } from '@/lib/auth';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request, { params }) {
  return withDB(async () => {
    try {
      const { id } = await params;
      const category = await Category.findById(id);
      if (!category)
        return NextResponse.json(
          { message: 'Category not found' },
          { status: 404, headers: NO_STORE }
        );
      return NextResponse.json(category, { headers: NO_STORE });
    } catch (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500, headers: NO_STORE }
      );
    }
  });
}

export async function PUT(request, { params }) {
  return withDB(async () => {
    try {
      const { id } = await params;
      const user = await authenticate(request);
      if (!user || !user.isAdmin)
        return NextResponse.json(
          { message: 'Not authorized as admin' },
          { status: 401, headers: NO_STORE }
        );

      const body = await request.json();
      const category = await Category.findById(id);
      if (!category)
        return NextResponse.json(
          { message: 'Category not found' },
          { status: 404, headers: NO_STORE }
        );

      category.name = body.name || category.name;
      category.slug = body.slug || category.slug;
      category.image = body.image || category.image;
      category.description = body.description || category.description;

      const updatedCategory = await category.save();
      return NextResponse.json(updatedCategory, { headers: NO_STORE });
    } catch (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500, headers: NO_STORE }
      );
    }
  });
}

export async function DELETE(request, { params }) {
  return withDB(async () => {
    try {
      const { id } = await params;
      const user = await authenticate(request);
      if (!user || !user.isAdmin)
        return NextResponse.json(
          { message: 'Not authorized as admin' },
          { status: 401, headers: NO_STORE }
        );

      const category = await Category.findById(id);
      if (!category)
        return NextResponse.json(
          { message: 'Category not found' },
          { status: 404, headers: NO_STORE }
        );

      await category.deleteOne();
      return NextResponse.json(
        { message: 'Category removed' },
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
