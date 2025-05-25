import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth.config";

// Create new order
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, pickupAddress, contactNumber, notes, totalAmount } =
      await req.json();

    // Debug: Log the prisma client structure
    console.log("Prisma client keys:", Object.keys(prisma));
    console.log("Prisma.order exists:", !!prisma.order);

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required and must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: "Total amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate that all products have sufficient stock before creating order
    for (const item of items) {
      if (!item.product?.id || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: "Invalid item data: product ID and quantity are required" },
          { status: 400 }
        );
      }

      const product = await prisma.product.findUnique({
        where: { id: item.product.id },
        select: { stock: true, name: true }
      });
      
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.product.id} not found` },
          { status: 400 }
        );
      }
      
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` },
          { status: 400 }
        );
      }
    }

    // Alternative approach: Try without transaction first
    try {
      // Create the order first
      const newOrder = await prisma.order.create({
        data: {
          userId: session.user.id,
          totalAmount: parseFloat(totalAmount.toString()),
          pickupAddress: pickupAddress || null,
          contactNumber: contactNumber || null,
          notes: notes || null,
        },
      });

      console.log("Order created successfully:", newOrder.id);

      // Create order items
      const orderItemsData = items.map((item: any) => ({
        orderId: newOrder.id,
        productId: item.product.id,
        quantity: item.quantity,
        price: parseFloat(item.product.price.toString()),
      }));

      await prisma.orderItem.createMany({
        data: orderItemsData,
      });

      console.log("Order items created successfully");

      // Update product stock and sales count
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
            sales_count: {
              increment: item.quantity,
            },
          },
        });
      }

      console.log("Product stock updated successfully");

      // Clear the user's cart
      await prisma.cartItem.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      console.log("Cart cleared successfully");

      // Fetch the complete order with relations
      const completeOrder = await prisma.order.findUnique({
        where: { id: newOrder.id },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  name: true,
                  image: true,
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
          },
        },
      });

      return NextResponse.json(completeOrder);

    } catch (transactionError) {
      console.error("Error in order creation process:", transactionError);
      
      // If we created an order but failed later, clean it up
      try {
        await prisma.order.delete({
          where: { userId: session.user.id },
        });
      } catch (cleanupError) {
        console.error("Error cleaning up failed order:", cleanupError);
      }
      
      throw transactionError;
    }

  } catch (error) {
    console.error("Error creating order:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

// Get user's orders
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                image: true,
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
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}