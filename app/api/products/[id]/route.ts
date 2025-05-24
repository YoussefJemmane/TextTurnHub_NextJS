import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/products/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const productId = parseInt(params.id);
    
    // Get product with artisan details
    const product = await prisma.product.findUnique({
      where: { id: productId },
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
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/products/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const productId = parseInt(params.id);
    const body = await request.json();
    
    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        artisanProfile: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if user owns this product or is admin
    const isOwner = product.artisanProfile.user_id === userId;
    const isAdmin = session.user.roles.includes("admin");
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You don't own this product" }, { status: 403 });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        price: body.price,
        stock: body.stock,
        unit: body.unit,
        color: body.color,
        material: body.material,
        image: body.image,
        is_featured: isAdmin ? body.is_featured : product.is_featured // Only admin can update featured status
      }
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const productId = parseInt(params.id);
    
    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        artisanProfile: true
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if user owns this product or is admin
    const isOwner = product.artisanProfile.user_id === userId;
    const isAdmin = session.user.roles.includes("admin");
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You don't own this product" }, { status: 403 });
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}