import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth.config";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the artisan's profile
    const artisanProfile = await prisma.artisanProfile.findUnique({
      where: {
        user_id: session.user.id,
      },
    });

    if (!artisanProfile) {
      return NextResponse.json(
        { error: "Artisan profile not found" },
        { status: 404 }
      );
    }

    // Find all orders that contain products from this artisan
    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            product: {
              artisan_profile_id: artisanProfile.id,
            },
          },
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Transform the data to match the frontend expectations
    const transformedOrders = orders.map((order) => {
      // Filter order items to only include this artisan's products
      const artisanOrderItems = order.orderItems.filter(
        (item) =>
          item.product && item.product.artisan_profile_id === artisanProfile.id
      );

      return {
        id: order.id,
        createdAt: order.created_at,
        status: order.status,
        totalAmount: order.totalAmount,
        pickupAddress: order.pickupAddress,
        contactNumber: order.contactNumber,
        orderItems: artisanOrderItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image,
            unit: item.product.unit,
            artisanProfile: {
              user: {
                name: session.user.name || "",
              },
            },
          },
        })),
      };
    });

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error("Error fetching artisan orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
