import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Add detailed logging for debugging
    console.log("Session:", session);

    if (!session?.user?.id) {
      console.log("No session or user ID found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Handle both string and number user IDs
    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id;

    console.log("User ID:", userId, "Roles:", session.user.roles);

    // Check if roles exist and is an array
    if (!session.user.roles || !Array.isArray(session.user.roles)) {
      console.log("No roles found or roles is not an array");
      return NextResponse.json({
        listings: 0,
        transactions: 0,
        products: 0
      });
    }

    if (session.user.roles.includes('company')) {
      console.log("Processing company user");
      
      try {
        // Get company profile
        const companyProfile = await prisma.companyProfile.findUnique({
          where: { user_id: userId }
        });

        console.log("Company profile:", companyProfile);

        if (!companyProfile) {
          console.log("Company profile not found, creating default response");
          return NextResponse.json({
            listings: 0,
            transactions: 0,
            products: 0,
            message: "Company profile not found"
          });
        }

        // Get company-specific stats with error handling
        const [listings, transactions] = await Promise.all([
          prisma.textileWaste.count({
            where: {
              company_profile_id: companyProfile.id,
              availability_status: "available"
            }
          }).catch(err => {
            console.error("Error counting textile waste:", err);
            return 0;
          }),
          prisma.wasteExchange.count({
            where: {
              textileWaste: {
                company_profile_id: companyProfile.id
              },
              status: "completed"
            }
          }).catch(err => {
            console.error("Error counting waste exchanges:", err);
            return 0;
          })
        ]);

        console.log("Company stats - Listings:", listings, "Transactions:", transactions);

        return NextResponse.json({
          listings,
          transactions,
          products: 0 // Companies don't have products
        });
      } catch (error) {
        console.error("Error in company section:", error);
        return NextResponse.json({
          listings: 0,
          transactions: 0,
          products: 0,
          error: "Failed to fetch company data"
        });
      }
    }

    if (session.user.roles.includes('artisan')) {
      console.log("Processing artisan user");
      
      try {
        // Get artisan profile
        const artisanProfile = await prisma.artisanProfile.findUnique({
          where: { user_id: userId }
        });

        console.log("Artisan profile:", artisanProfile);

        if (!artisanProfile) {
          console.log("Artisan profile not found, creating default response");
          return NextResponse.json({
            listings: 0,
            transactions: 0,
            products: 0,
            message: "Artisan profile not found"
          });
        }

        // Get artisan-specific stats with error handling
        const [products, availableListings] = await Promise.all([
          prisma.product.count({
            where: {
              artisan_profile_id: artisanProfile.id
            }
          }).catch(err => {
            console.error("Error counting products:", err);
            return 0;
          }),
          prisma.textileWaste.count({
            where: {
              availability_status: "available"
            }
          }).catch(err => {
            console.error("Error counting available listings:", err);
            return 0;
          })
        ]);

        console.log("Artisan stats - Products:", products, "Available listings:", availableListings);

        return NextResponse.json({
          products,
          listings: availableListings,
          transactions: 0 // For now, not tracking artisan transactions
        });
      } catch (error) {
        console.error("Error in artisan section:", error);
        return NextResponse.json({
          products: 0,
          listings: 0,
          transactions: 0,
          error: "Failed to fetch artisan data"
        });
      }
    }

    if (session.user.roles.includes('admin')) {
      console.log("Processing admin user");
      
      try {
        // Get admin-specific stats
        const [totalUsers, totalProducts, totalWaste, totalExchanges] = await Promise.all([
          prisma.user.count().catch(() => 0),
          prisma.product.count().catch(() => 0),
          prisma.textileWaste.count().catch(() => 0),
          prisma.wasteExchange.count().catch(() => 0)
        ]);

        // Get user role distribution
        const userRoles = await prisma.user.findMany({
          select: { roles: true }
        }).catch(() => []);

        const roleCount = userRoles.reduce((acc, user) => {
          user.roles.forEach(role => {
            acc[role] = (acc[role] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
          overview: {
            users: { 
              total: totalUsers, 
              new: 0, // You might want to calculate this based on recent signups
              byRole: roleCount 
            },
            products: { 
              total: totalProducts, 
              new: 0, // Calculate based on recent products
              totalSales: 0 // Calculate if you have sales data
            },
            waste: { 
              total: totalWaste, 
              new: 0 // Calculate based on recent waste listings
            },
            exchanges: { 
              total: totalExchanges, 
              completed: await prisma.wasteExchange.count({
                where: { status: "completed" }
              }).catch(() => 0)
            }
          }
        });
      } catch (error) {
        console.error("Error in admin section:", error);
        return NextResponse.json({
          overview: {
            users: { total: 0, new: 0, byRole: {} },
            products: { total: 0, new: 0, totalSales: 0 },
            waste: { total: 0, new: 0 },
            exchanges: { total: 0, completed: 0 }
          },
          error: "Failed to fetch admin data"
        });
      }
    }

    // Default response for other roles
    console.log("No matching role found, returning default response");
    return NextResponse.json({
      listings: 0,
      transactions: 0,
      products: 0,
      message: `No data available for roles: ${session.user.roles.join(', ')}`
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        listings: 0,
        transactions: 0,
        products: 0
      },
      { status: 500 }
    );
  }
}