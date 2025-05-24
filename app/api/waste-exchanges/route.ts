import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/waste-exchanges
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, sent, received
    const status = searchParams.get("status") || "all"; // all, pending, accepted, rejected, completed, cancelled
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Get user's company profile if they are a company
    let companyProfileId = null;
    if (session.user.roles.includes("company")) {
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { user_id: userId }
      });
      
      if (companyProfile) {
        companyProfileId = companyProfile.id;
      }
    }

    // Build query based on user type and request type
    let whereClause = {};
    
    // Filter by status if specified
    if (status !== "all") {
      whereClause = { ...whereClause, status };
    }

    // For companies, get exchanges for their textile waste
    if (companyProfileId) {
      if (type === "received" || type === "all") {
        const wasteExchanges = await prisma.wasteExchange.findMany({
          where: {
            ...whereClause,
            textileWaste: {
              company_profile_id: companyProfileId
            }
          },
          include: {
            textileWaste: {
              include: {
                companyProfile: {
                  select: {
                    company_name: true
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: { created_at: "desc" }
        });

        const total = await prisma.wasteExchange.count({
          where: {
            ...whereClause,
            textileWaste: {
              company_profile_id: companyProfileId
            }
          }
        });

        return NextResponse.json({ 
          wasteExchanges,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        });
      }
    }

    // For all users - get exchanges they've requested
    if (type === "sent" || type === "all") {
      const wasteExchanges = await prisma.wasteExchange.findMany({
        where: {
          ...whereClause,
          requester_id: userId
        },
        include: {
          textileWaste: {
            include: {
              companyProfile: {
                select: {
                  company_name: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { created_at: "desc" }
      });

      const total = await prisma.wasteExchange.count({
        where: {
          ...whereClause,
          requester_id: userId
        }
      });

      return NextResponse.json({ 
        wasteExchanges,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    // Fallback for unknown type
    return NextResponse.json({ 
      wasteExchanges: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0
      }
    });
  } catch (error) {
    console.error("Error fetching waste exchanges:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/waste-exchanges
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { textile_waste_id, quantity, request_message } = body;

    // Validate textile waste id
    if (!textile_waste_id) {
      return NextResponse.json({ error: "Textile waste ID is required" }, { status: 400 });
    }

    // Get textile waste
    const textileWaste = await prisma.textileWaste.findUnique({
      where: { id: parseInt(textile_waste_id) },
      include: {
        companyProfile: true
      }
    });

    if (!textileWaste) {
      return NextResponse.json({ error: "Textile waste not found" }, { status: 404 });
    }

    // Check if textile waste is available
    if (textileWaste.availability_status !== "available") {
      return NextResponse.json({ error: "Textile waste is not available" }, { status: 400 });
    }

    // Check if user is not requesting their own textile waste
    if (textileWaste.companyProfile.user_id === userId) {
      return NextResponse.json({ error: "You cannot request your own textile waste" }, { status: 400 });
    }

    // Create waste exchange
    const wasteExchange = await prisma.wasteExchange.create({
      data: {
        textile_waste_id: parseInt(textile_waste_id),
        requester_id: userId,
        quantity,
        request_message,
        status: "pending"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Waste exchange request created successfully",
      wasteExchange
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating waste exchange:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}