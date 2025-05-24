import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// GET /api/products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const material = searchParams.get("material") || "";

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // If user is an artisan, only show their products
    if (session.user.roles.includes("artisan")) {
      const artisanProfile = await prisma.artisanProfile.findUnique({
        where: { user_id: session.user.id },
      });

      if (!artisanProfile) {
        return NextResponse.json(
          { error: "Artisan profile not found" },
          { status: 404 }
        );
      }

      where.artisan_profile_id = artisanProfile.id;
    }

    // Add search filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (material) {
      where.material = material;
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Get products
    const products = await prisma.product.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles.includes("artisan")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get artisan profile
    const artisanProfile = await prisma.artisanProfile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!artisanProfile) {
      return NextResponse.json(
        { error: "Artisan profile not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stock") as string);
    const unit = formData.get("unit") as string;
    const color = formData.get("color") as string;
    const material = formData.get("material") as string;
    const image = formData.get("image") as string | null;

    // Validate required fields
    if (!name || !description || !category || !price || !stock || !material) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        price,
        stock,
        unit,
        color,
        material,
        image, // Store base64 image directly
        artisan_profile_id: artisanProfile.id,
      },
    });

    revalidatePath("/products/manage");
    revalidatePath("/shop");

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
