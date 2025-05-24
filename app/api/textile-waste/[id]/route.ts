import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/textile-waste/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const textileWasteId = parseInt(params.id);
    
    // Get textile waste with company details
    const textileWaste = await prisma.textileWaste.findUnique({
      where: { id: textileWasteId },
      include: {
        companyProfile: {
          select: {
            id: true,
            company_name: true,
            industry: true,
            location: true,
            user_id: true
          }
        }
      }
    });

    if (!textileWaste) {
      return NextResponse.json({ error: "Textile waste not found" }, { status: 404 });
    }

    // Parse JSON fields
    if (textileWaste.images && typeof textileWaste.images === 'string') {
      try {
        textileWaste.images = JSON.parse(textileWaste.images);
      } catch (e) {
        textileWaste.images = [];
      }
    }

    if (textileWaste.sustainability_metrics && typeof textileWaste.sustainability_metrics === 'string') {
      try {
        textileWaste.sustainability_metrics = JSON.parse(textileWaste.sustainability_metrics);
      } catch (e) {
        textileWaste.sustainability_metrics = {};
      }
    }

    return NextResponse.json({ textileWaste });
  } catch (error) {
    console.error("Error fetching textile waste:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/textile-waste/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const textileWasteId = parseInt(params.id);
    const body = await request.json();
    
    // Get textile waste
    const textileWaste = await prisma.textileWaste.findUnique({
      where: { id: textileWasteId },
      include: {
        companyProfile: true
      }
    });

    if (!textileWaste) {
      return NextResponse.json({ error: "Textile waste not found" }, { status: 404 });
    }

    // Check if user owns this textile waste
    if (textileWaste.companyProfile.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden: You don't own this textile waste" }, { status: 403 });
    }

    // Update textile waste
    const updatedTextileWaste = await prisma.textileWaste.update({
      where: { id: textileWasteId },
      data: {
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
        location: body.location,
        availability_status: body.availability_status,
        images: body.images ? JSON.stringify(body.images) : textileWaste.images,
        sustainability_metrics: body.sustainability_metrics ? JSON.stringify(body.sustainability_metrics) : textileWaste.sustainability_metrics
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

// DELETE /api/textile-waste/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const textileWasteId = parseInt(params.id);
    
    // Get textile waste
    const textileWaste = await prisma.textileWaste.findUnique({
      where: { id: textileWasteId },
      include: {
        companyProfile: true
      }
    });

    if (!textileWaste) {
      return NextResponse.json({ error: "Textile waste not found" }, { status: 404 });
    }

    // Check if user owns this textile waste or is admin
    if (textileWaste.companyProfile.user_id !== userId && !session.user.roles.includes("admin")) {
      return NextResponse.json({ error: "Forbidden: You don't own this textile waste" }, { status: 403 });
    }

    // Delete textile waste
    await prisma.textileWaste.delete({
      where: { id: textileWasteId }
    });

    return NextResponse.json({
      success: true,
      message: "Textile waste deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting textile waste:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}