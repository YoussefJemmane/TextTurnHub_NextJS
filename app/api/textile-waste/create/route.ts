import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.user.roles.includes("company")) {
      return NextResponse.json(
        { error: "Forbidden: Requires company role" },
        { status: 403 }
      );
    }
    const userId = parseInt(session.user.id);
    const body = await request.json();
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { user_id: userId },
    });
    if (!companyProfile) {
      return NextResponse.json(
        { error: "Company profile not found" },
        { status: 404 }
      );
    }
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
        availability_status: body.availability_status || "available",
        images: body.images ? JSON.stringify(body.images) : null,
        sustainability_metrics: body.sustainability_metrics
          ? JSON.stringify(body.sustainability_metrics)
          : null,
      },
    });
    return NextResponse.json(
      {
        success: true,
        message: "Textile waste listed successfully",
        textileWaste: newTextileWaste,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating textile waste listing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
