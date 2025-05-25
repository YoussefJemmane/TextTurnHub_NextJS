import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is logged in
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    const userId = session.user.id; // Keep as string to match schema

    // Check if user has artisan role through database instead of session
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        artisanProfile: true // Also check if artisan profile exists
      }
    });

    if (!userWithRoles) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has artisan role OR has an artisan profile
    const hasArtisanRole = userWithRoles.roles.some(ur => ur.role.name === "artisan");
    
    const hasArtisanProfile = !!userWithRoles.artisanProfile;

    if (!hasArtisanRole && !hasArtisanProfile) {
      return NextResponse.json({ 
        error: "Unauthorized - Artisan access required" 
      }, { status: 403 });
    }

    // Use the artisan profile we already fetched
    const artisanProfile = userWithRoles.artisanProfile;

    if (!artisanProfile) {
      return NextResponse.json(
        { error: "Artisan profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "7d";

    // Get date range
    const startDate = (() => {
      const now = new Date();
      switch (timeRange) {
        case "24h":
          return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case "7d":
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "30d":
          return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case "90d":
          return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case "1y":
          return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    })();

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

      // Product timeline data - Group by date, not exact timestamp
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as products,
          SUM(sales_count) as sales
        FROM Product 
        WHERE artisan_profile_id = ${artisanProfile.id} 
          AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,

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
          material: { not: null }, // Exclude null materials
        },
        _count: { id: true },
        _sum: { sales_count: true },
      }),

      // Waste requests - get all exchanges for analytics
      // Note: Based on your schema, there's no direct relation between artisan and waste exchanges
      // This query gets general waste exchange data for market insights
      prisma.wasteExchange.findMany({
        where: {
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
              waste_type: true,
            },
          },
        },
        take: 100, // Limit for performance
      }),

      // Category distribution
      prisma.product.groupBy({
        by: ["category"],
        where: {
          artisan_profile_id: artisanProfile.id,
          created_at: { gte: startDate },
          category: { not: null }, // Exclude null categories
        },
        _count: { id: true },
        _sum: { sales_count: true },
      }),
    ]);

    // Process timeline data - Handle the raw query result
    const timeline = Array.isArray(productTimeline) ? productTimeline.map((entry: any) => ({
      date: entry.date instanceof Date ? entry.date.toISOString().split("T")[0] : entry.date,
      products: Number(entry.products) || 0,
      sales: Number(entry.sales) || 0,
    })) : [];

    // Calculate revenue for top products
    const topProductsWithRevenue = topProducts.map((product) => ({
      ...product,
      price: Number(product.price),
      revenue: Number(product.price) * (product.sales_count || 0),
    }));

    // Process material usage data
    const materials = materialUsage.map((material) => ({
      name: material.material || "Unknown",
      products: material._count.id,
      sales: material._sum.sales_count || 0,
    }));

    // Process category distribution
    const categories = categoryDistribution.map((category) => ({
      name: category.category || "Uncategorized",
      products: category._count.id,
      sales: category._sum.sales_count || 0,
    }));

    // Process waste requests - market insights for artisans
    const wasteStats = {
      total: wasteRequests.length,
      pending: wasteRequests.filter((r) => r.status === "pending").length,
      accepted: wasteRequests.filter((r) => r.status === "accepted").length,
      completed: wasteRequests.filter((r) => r.status === "completed").length,
      rejected: wasteRequests.filter((r) => r.status === "rejected").length,
      cancelled: wasteRequests.filter((r) => r.status === "cancelled").length,
      byMaterial: wasteRequests.reduce((acc, req) => {
        const material = req.textileWaste?.material_type || "Unknown";
        acc[material] = (acc[material] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byWasteType: wasteRequests.reduce((acc, req) => {
        const wasteType = req.textileWaste?.waste_type || "Unknown";
        acc[wasteType] = (acc[wasteType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      overview: {
        totalProducts: productStats._count.id || 0,
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