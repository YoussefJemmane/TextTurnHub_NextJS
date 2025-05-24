import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow public access to products for the marketplace
    const { searchParams } = new URL(request.url);
    const isMarketplace = searchParams.get("marketplace") === "true";
    const featured = searchParams.get("featured") === "true";
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    let whereClause: any = {};
    
    if (featured) {
      whereClause.is_featured = true;
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { material: { contains: search } },
      ];
    }

    // For marketplace, only show products with stock > 0 and exclude current artisan's products
    if (isMarketplace) {
      whereClause.stock = { gt: 0 };
      
      // If the user is an artisan, exclude their own products from marketplace
      if (session?.user?.id && session.user.roles.includes("artisan")) {
        const userId = parseInt(session.user.id);
        
        const artisanProfile = await prisma.artisanProfile.findUnique({
          where: { user_id: userId }
        });

        if (artisanProfile) {
          whereClause.artisan_profile_id = { not: artisanProfile.id };
        }
      }
    }
    // For artisan's own products, filter by their profile
    else if (session?.user?.id && session.user.roles.includes("artisan")) {
      const userId = parseInt(session.user.id);
      
      const artisanProfile = await prisma.artisanProfile.findUnique({
        where: { user_id: userId }
      });

      if (artisanProfile) {
        whereClause.artisan_profile_id = artisanProfile.id;
      }
    }

    // Get products
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: whereClause,
        include: {
          artisanProfile: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: featured ? { is_featured: 'desc' } : { created_at: 'desc' }
      }),
      prisma.product.count({
        where: whereClause
      })
    ]);

    return NextResponse.json({ 
      products, 
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has artisan role
    if (!session.user.roles.includes("artisan")) {
      return NextResponse.json({ error: "Forbidden: Requires artisan role" }, { status: 403 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    
    // Get artisan profile
    const artisanProfile = await prisma.artisanProfile.findUnique({
      where: { user_id: userId }
    });

    if (!artisanProfile) {
      return NextResponse.json({ error: "Artisan profile not found" }, { status: 404 });
    }

    // Create product
    const newProduct = await prisma.product.create({
      data: {
        artisan_profile_id: artisanProfile.id,
        name: body.name,
        description: body.description,
        category: body.category,
        price: body.price,
        stock: body.stock || 0,
        unit: body.unit,
        color: body.color,
        material: body.material,
        image: body.image,
        is_featured: false
      }
    });

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product: newProduct
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}