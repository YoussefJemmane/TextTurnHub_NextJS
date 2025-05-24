import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles.includes("artisan")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "7d";

    // Get date range
    const startDate = (() => {
      const now = new Date();
      switch (timeRange) {
        case "24h":
          return new Date(now.setHours(now.getHours() - 24));
        case "7d":
          return new Date(now.setDate(now.getDate() - 7));
        case "30d":
          return new Date(now.setDate(now.getDate() - 30));
        case "90d":
          return new Date(now.setDate(now.getDate() - 90));
        case "1y":
          return new Date(now.setFullYear(now.getFullYear() - 1));
        default:
          return new Date(now.setDate(now.getDate() - 7));
      }
    })();

    // Get artisan profile
    const artisanProfile = await prisma.artisanProfile.findUnique({
      where: { user_id: userId },
    });

    if (!artisanProfile) {
      return NextResponse.json(
        { error: "Artisan profile not found" },
        { status: 404 }
      );
    }

    // Get all required data in parallel
    const [
      productStats,
      productTimeline,
      topProducts,
      materialUsage,
      wasteRequests,
      categoryDistribution,
    ] = await Promise.all([
      // Overall product stats
      prisma.product.aggregate({
        where: {
          artisan_profile_id: artisanProfile.id,
          created_at: { gte: startDate },
        },
        _count: { id: true },
        _sum: {
          sales_count: true,
          stock: true,
        },
      }),

      // Product timeline data
      prisma.product.groupBy({
        by: ["created_at"],
        where: {
          artisan_profile_id: artisanProfile.id,
          created_at: { gte: startDate },
        },
        _count: { id: true },
        _sum: { sales_count: true },
      }),

      // Top performing products
      prisma.product.findMany({
        where: {
          artisan_profile_id: artisanProfile.id,
          created_at: { gte: startDate },
        },
        orderBy: { sales_count: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          price: true,
          sales_count: true,
          stock: true,
          category: true,
        },
      }),

      // Material usage stats
      prisma.product.groupBy({
        by: ["material"],
        where: {
          artisan_profile_id: artisanProfile.id,
          created_at: { gte: startDate },
        },
        _count: { id: true },
        _sum: { sales_count: true },
      }),

      // Waste requests - using requester_id and including textile waste relation
      prisma.wasteExchange.findMany({
        where: {
          requester_id: userId,
          created_at: { gte: startDate },
        },
        select: {
          id: true,
          status: true,
          quantity: true,
          created_at: true,
          textileWaste: {
            select: {
              material_type: true,
            },
          },
        },
      }),

      // Category distribution
      prisma.product.groupBy({
        by: ["category"],
        where: {
          artisan_profile_id: artisanProfile.id,
          created_at: { gte: startDate },
        },
        _count: { id: true },
        _sum: { sales_count: true },
      }),
    ]);

    // Process timeline data
    const timeline = productTimeline.map((entry) => ({
      date: entry.created_at.toISOString().split("T")[0],
      products: entry._count.id,
      sales: entry._sum.sales_count || 0,
    }));

    // Calculate revenue for top products
    const topProductsWithRevenue = topProducts.map((product) => ({
      ...product,
      revenue: Number(product.price) * (product.sales_count || 0),
    }));

    // Process material usage data
    const materials = materialUsage.map((material) => ({
      name: material.material,
      products: material._count.id,
      sales: material._sum.sales_count || 0,
    }));

    // Process category distribution
    const categories = categoryDistribution.map((category) => ({
      name: category.category,
      products: category._count.id,
      sales: category._sum.sales_count || 0,
    }));

    // Process waste requests
    const wasteStats = {
      total: wasteRequests.length,
      pending: wasteRequests.filter((r) => r.status === "pending").length,
      approved: wasteRequests.filter((r) => r.status === "approved").length,
      completed: wasteRequests.filter((r) => r.status === "completed").length,
      byMaterial: wasteRequests.reduce((acc, req) => {
        const material = req.textileWaste?.material_type || "Unknown";
        acc[material] = (acc[material] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      overview: {
        totalProducts: productStats._count.id,
        totalSales: productStats._sum.sales_count || 0,
        currentStock: productStats._sum.stock || 0,
        wasteRequests: wasteStats.total,
      },
      timeline,
      topProducts: topProductsWithRevenue,
      materials,
      categories,
      wasteStats,
    });
  } catch (error) {
    console.error("Error fetching artisan analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
