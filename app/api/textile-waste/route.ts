import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/textile-waste
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "available";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // If company user, get only OTHER companies' waste listings (exclude their own)
    if (session.user.roles.includes("company")) {
      const userId = parseInt(session.user.id);
      
      // Get company profile
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { user_id: userId }
      });

      if (!companyProfile) {
        return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
      }

      // Get OTHER companies' textile waste listings (NOT the current company's)
      const [textileWastes, total] = await prisma.$transaction([
        prisma.textileWaste.findMany({
          where: { 
            company_profile_id: { not: companyProfile.id }, // Exclude current company's listings
            ...(status !== "all" ? { availability_status: status } : {})
          },
          include: {
            companyProfile: {
              select: {
                company_name: true,
                location: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { created_at: "desc" }
        }),
        prisma.textileWaste.count({
          where: { 
            company_profile_id: { not: companyProfile.id }, // Exclude current company's listings
            ...(status !== "all" ? { availability_status: status } : {})
          }
        })
      ]);

      return NextResponse.json({ 
        textileWastes, 
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } 
    // Otherwise, return all available textile waste
    else {
      const [textileWastes, total] = await prisma.$transaction([
        prisma.textileWaste.findMany({
          where: { 
            ...(status !== "all" ? { availability_status: status } : {})
          },
          include: {
            companyProfile: {
              select: {
                company_name: true,
                location: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { created_at: "desc" }
        }),
        prisma.textileWaste.count({
          where: { 
            ...(status !== "all" ? { availability_status: status } : {})
          }
        })
      ]);

      return NextResponse.json({ 
        textileWastes, 
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error("Error fetching textile waste:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/textile-waste
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has company role
    if (!session.user.roles.includes("company")) {
      return NextResponse.json({ error: "Forbidden: Requires company role" }, { status: 403 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    
    // Get company profile
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { user_id: userId }
    });

    if (!companyProfile) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    // Create textile waste listing
    const newTextileWaste = await prisma.textileWaste.create({
      data: {
        company_profile_id: companyProfile.id,
        title: body.title,
        description: body.description,
        waste_type: body.waste_type,
        material_type: body.material_type,
        quantity: body.quantity,
        unit: body.unit,
        condition: body.condition,
        color: body.color,
        composition: body.composition,
        minimum_order_quantity: body.minimum_order_quantity,
        price_per_unit: body.price_per_unit,
        location: body.location || companyProfile.location,
        availability_status: "available",
        images: body.images ? JSON.stringify(body.images) : null,
        sustainability_metrics: body.sustainability_metrics ? JSON.stringify(body.sustainability_metrics) : null
      }
    });

    return NextResponse.json({
      success: true,
      message: "Textile waste listed successfully",
      textileWaste: newTextileWaste
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating textile waste listing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}