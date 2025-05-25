import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";

// GET /api/waste-exchanges
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "received"; // 'received' or 'sent'
    const status = searchParams.get("status");

    let whereClause: any = {};

    // Filter by status if provided
    if (status && status !== "all") {
      whereClause.status = status;
    }

    // Keep user ID as string (no conversion needed)
    const userId = session.user.id;

    // For companies, first get their company profile
    if (type === "received" && session.user.roles?.includes("company")) {
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { user_id: userId }, // userId is already a string
        select: { id: true },
      });

      if (!companyProfile) {
        return NextResponse.json(
          { error: "Company profile not found" },
          { status: 404 }
        );
      }

      whereClause = {
        ...whereClause,
        textileWaste: {
          company_profile_id: companyProfile.id,
        },
      };
    } else if (type === "sent") {
      whereClause.requester_id = userId; // userId is a string, matching schema
    } else {
      return NextResponse.json(
        { error: "Invalid request type" },
        { status: 400 }
      );
    }

    const wasteExchanges = await prisma.wasteExchange.findMany({
      where: whereClause,
      include: {
        textileWaste: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({ wasteExchanges });
  } catch (error) {
    console.error("Error fetching waste exchanges:", error);
    return NextResponse.json(
      { error: "Failed to fetch waste exchanges" },
      { status: 500 }
    );
  }
}

// POST /api/waste-exchanges
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Keep userId as string - no parseInt needed
    const userId = session.user.id;
    const body = await request.json();
    const { textile_waste_id, quantity, request_message, city } = body;

    // Validate textile waste id
    if (!textile_waste_id) {
      return NextResponse.json(
        { error: "Textile waste ID is required" },
        { status: 400 }
      );
    }

    // Get textile waste
    const textileWaste = await prisma.textileWaste.findUnique({
      where: { id: parseInt(textile_waste_id) }, // Only convert textile_waste_id to int
      include: {
        companyProfile: true,
      },
    });

    if (!textileWaste) {
      return NextResponse.json(
        { error: "Textile waste not found" },
        { status: 404 }
      );
    }

    // Check if textile waste is available
    if (textileWaste.availability_status !== "available") {
      return NextResponse.json(
        { error: "Textile waste is not available" },
        { status: 400 }
      );
    }

    // Check if user is not requesting their own textile waste
    // Compare string userId with string user_id from companyProfile
    if (textileWaste.companyProfile.user_id === userId) {
      return NextResponse.json(
        { error: "You cannot request your own textile waste" },
        { status: 400 }
      );
    }

    // Create waste exchange
    const wasteExchange = await prisma.wasteExchange.create({
      data: {
        textile_waste_id: parseInt(textile_waste_id),
        requester_id: userId, // Keep as string - matches schema
        quantity,
        request_message,
        city,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Waste exchange request created successfully",
        wasteExchange,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating waste exchange:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}