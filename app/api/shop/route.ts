import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const material = searchParams.get("material") || "";
    const featured = searchParams.get("featured") === "true";

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      stock: { gt: 0 }, // Only show products with stock available
    };

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

    if (featured) {
      where.is_featured = true;
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Get products with artisan details
    const products = await prisma.product.findMany({
      where,
      include: {
        artisanProfile: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ is_featured: "desc" }, { created_at: "desc" }],
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
