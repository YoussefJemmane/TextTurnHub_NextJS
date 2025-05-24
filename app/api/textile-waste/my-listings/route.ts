import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/textile-waste/my-listings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has company role
    if (!session.user.roles.includes("company")) {
      return NextResponse.json({ error: "Forbidden: Requires company role" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const userId = parseInt(session.user.id);
    
    // Get company profile
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { user_id: userId }
    });

    if (!companyProfile) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    // Get ONLY the current company's textile waste listings
    const [textileWastes, total] = await prisma.$transaction([
      prisma.textileWaste.findMany({
        where: { 
          company_profile_id: companyProfile.id, // Only current company's listings
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
          company_profile_id: companyProfile.id, // Only current company's listings
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
  } catch (error) {
    console.error("Error fetching company textile waste:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/textile-waste/my-listings
export async function PUT(request: NextRequest) {
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Textile waste ID is required" }, { status: 400 });
    }

    // Get company profile
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { user_id: userId }
    });

    if (!companyProfile) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    // Verify the textile waste belongs to this company
    const existingTextileWaste = await prisma.textileWaste.findFirst({
      where: {
        id: parseInt(id),
        company_profile_id: companyProfile.id
      }
    });

    if (!existingTextileWaste) {
      return NextResponse.json({ error: "Textile waste not found or unauthorized" }, { status: 404 });
    }

    // Update textile waste listing
    const updatedTextileWaste = await prisma.textileWaste.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        images: updateData.images ? JSON.stringify(updateData.images) : undefined,
        sustainability_metrics: updateData.sustainability_metrics ? JSON.stringify(updateData.sustainability_metrics) : undefined,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Textile waste updated successfully",
      textileWaste: updatedTextileWaste
    });
  } catch (error) {
    console.error("Error updating textile waste:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/textile-waste/my-listings
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has company role
    if (!session.user.roles.includes("company")) {
      return NextResponse.json({ error: "Forbidden: Requires company role" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids"); // For bulk delete

    if (!id && !ids) {
      return NextResponse.json({ error: "ID or IDs required" }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    
    // Get company profile
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { user_id: userId }
    });

    if (!companyProfile) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    if (id) {
      // Single delete
      const existingTextileWaste = await prisma.textileWaste.findFirst({
        where: {
          id: parseInt(id),
          company_profile_id: companyProfile.id
        }
      });

      if (!existingTextileWaste) {
        return NextResponse.json({ error: "Textile waste not found or unauthorized" }, { status: 404 });
      }

      await prisma.textileWaste.delete({
        where: { id: parseInt(id) }
      });

      return NextResponse.json({
        success: true,
        message: "Textile waste deleted successfully"
      });
    } else if (ids) {
      // Bulk delete
      const idsArray = ids.split(",").map(id => parseInt(id.trim()));
      
      // Verify all items belong to this company
      const existingTextileWastes = await prisma.textileWaste.findMany({
        where: {
          id: { in: idsArray },
          company_profile_id: companyProfile.id
        }
      });

      if (existingTextileWastes.length !== idsArray.length) {
        return NextResponse.json({ error: "Some textile waste items not found or unauthorized" }, { status: 404 });
      }

      const deletedCount = await prisma.textileWaste.deleteMany({
        where: {
          id: { in: idsArray },
          company_profile_id: companyProfile.id
        }
      });

      return NextResponse.json({
        success: true,
        message: `${deletedCount.count} textile waste items deleted successfully`,
        deletedCount: deletedCount.count
      });
    }
  } catch (error) {
    console.error("Error deleting textile waste:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}