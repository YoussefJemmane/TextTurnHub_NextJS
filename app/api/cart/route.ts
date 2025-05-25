import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth.config";

// Get cart items
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a buyer
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!buyerProfile) {
      return NextResponse.json(
        { error: "Only buyers can access cart" },
        { status: 403 }
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
            stock: true,
            unit: true,
            artisanProfile: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart items" },
      { status: 500 }
    );
  }
}

// Add item to cart
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a buyer
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!buyerProfile) {
      return NextResponse.json(
        { error: "Only buyers can add items to cart" },
        { status: 403 }
      );
    }

    const { productId, quantity } = await req.json();

    // Validate input
    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid product ID or quantity" },
        { status: 400 }
      );
    }

    // Check if product exists and has enough stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 400 }
      );
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        userId: session.user.id,
        productId,
      },
    });

    let cartItem;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        buyerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existingCartItem) {
      // Update quantity if item exists
      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + quantity,
        },
        include: {
          product: {
            select: {
              name: true,
              price: true,
              image: true,
              stock: true,
              unit: true,
              artisanProfile: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else {
      // Create new cart item if it doesn't exist
      cartItem = await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId: productId,
          quantity: quantity,
        },
        include: {
          product: {
            select: {
              name: true,
              price: true,
              image: true,
              stock: true,
              unit: true,
              artisanProfile: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

// Update cart item quantity
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a buyer
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!buyerProfile) {
      return NextResponse.json(
        { error: "Only buyers can update cart" },
        { status: 403 }
      );
    }

    const { cartItemId, quantity } = await req.json();

    if (!cartItemId || !quantity || quantity < 0) {
      return NextResponse.json(
        { error: "Invalid cart item ID or quantity" },
        { status: 400 }
      );
    }

    // If quantity is 0, delete the item
    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });
      return NextResponse.json({ message: "Item removed from cart" });
    }

    // Update quantity
    const cartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            image: true,
            stock: true,
            unit: true,
            artisanProfile: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

// Delete item from cart
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a buyer
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!buyerProfile) {
      return NextResponse.json(
        { error: "Only buyers can remove items from cart" },
        { status: 403 }
      );
    }

    const { cartItemId } = await req.json();

    if (!cartItemId) {
      return NextResponse.json(
        { error: "Cart item ID is required" },
        { status: 400 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return NextResponse.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Error deleting from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}
