import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// Helper function to get date range based on timeRange parameter
const getDateRange = (timeRange: string) => {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setDate(now.getDate() - 7));
  }
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('admin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const startDate = getDateRange(timeRange);

    // Fetch all required statistics in parallel
    const [
      // User statistics
      totalUsers,
      newUsers,
      usersByRole,

      // Product statistics
      totalProducts,
      newProducts,
      productSales,

      // Textile waste statistics
      totalWaste,
      newWaste,
      totalExchanges,
      completedExchanges,

      // Time series data for charts
      userGrowth,
      productGrowth,
      exchangeGrowth,
    ] = await Promise.all([
      // Total users and new users
      prisma.user.count(),
      prisma.user.count({
        where: {
          created_at: {
            gte: startDate
          }
        }
      }),

      // Users by role
      prisma.userRole.groupBy({
        by: ['role_id'],
        _count: true,
        include: {
          role: true
        }
      }),

      // Total products and new products
      prisma.product.count(),
      prisma.product.count({
        where: {
          created_at: {
            gte: startDate
          }
        }
      }),

      // Product sales statistics
      prisma.product.aggregate({
        _sum: {
          sales_count: true
        }
      }),

      // Total waste listings and new listings
      prisma.textileWaste.count(),
      prisma.textileWaste.count({
        where: {
          created_at: {
            gte: startDate
          }
        }
      }),

      // Total exchanges and completed exchanges
      prisma.wasteExchange.count(),
      prisma.wasteExchange.count({
        where: {
          status: 'completed',
          created_at: {
            gte: startDate
          }
        }
      }),

      // User growth over time
      prisma.user.groupBy({
        by: ['created_at'],
        _count: true,
        where: {
          created_at: {
            gte: startDate
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      }),

      // Product growth over time
      prisma.product.groupBy({
        by: ['created_at'],
        _count: true,
        where: {
          created_at: {
            gte: startDate
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      }),

      // Exchange growth over time
      prisma.wasteExchange.groupBy({
        by: ['created_at'],
        _count: true,
        where: {
          created_at: {
            gte: startDate
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      })
    ]);

    // Process time series data
    const processTimeSeriesData = (data: any[]) => {
      return data.reduce((acc, item) => {
        const date = new Date(item.created_at).toLocaleDateString();
        return {
          labels: [...acc.labels, date],
          data: [...acc.data, item._count]
        };
      }, { labels: [], data: [] });
    };

    return NextResponse.json({
      overview: {
        users: {
          total: totalUsers,
          new: newUsers,
          byRole: usersByRole.reduce((acc, role) => ({
            ...acc,
            [role.role.name]: role._count
          }), {})
        },
        products: {
          total: totalProducts,
          new: newProducts,
          totalSales: productSales._sum.sales_count || 0
        },
        waste: {
          total: totalWaste,
          new: newWaste
        },
        exchanges: {
          total: totalExchanges,
          completed: completedExchanges
        }
      },
      timeSeries: {
        users: processTimeSeriesData(userGrowth),
        products: processTimeSeriesData(productGrowth),
        exchanges: processTimeSeriesData(exchangeGrowth)
      }
    });

  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

