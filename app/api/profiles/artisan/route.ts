import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";

// GET /api/profiles/artisan
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has artisan role
    if (!session.user.roles.includes("artisan")) {
      return NextResponse.json(
        { error: "Forbidden: Requires artisan role" },
        { status: 403 }
      );
    }

    const profile = await prisma.artisanProfile.findUnique({
      where: { user_id: session.user.id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Artisan profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching artisan profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/profiles/artisan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has artisan role
    if (!session.user.roles.includes("artisan")) {
      return NextResponse.json(
        { error: "Forbidden: Requires artisan role" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { artisan_specialty, artisan_experience, materials_interest } = body;

    // Check if artisan profile already exists
    const existingProfile = await prisma.artisanProfile.findUnique({
      where: { user_id: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Artisan profile already exists" },
        { status: 400 }
      );
    }

    // Create artisan profile
    const newProfile = await prisma.artisanProfile.create({
      data: {
        user_id: session.user.id,
        artisan_specialty,
        artisan_experience,
        materials_interest,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Artisan profile created successfully",
        profile: newProfile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating artisan profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/profiles/artisan
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has artisan role
    if (!session.user.roles.includes("artisan")) {
      return NextResponse.json(
        { error: "Forbidden: Requires artisan role" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { artisan_specialty, artisan_experience, materials_interest } = body;

    // Update artisan profile
    const updatedProfile = await prisma.artisanProfile.update({
      where: { user_id: session.user.id },
      data: {
        artisan_specialty,
        artisan_experience,
        materials_interest,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Artisan profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating artisan profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
