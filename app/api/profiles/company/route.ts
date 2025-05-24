import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/profiles/company
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

    const userId = parseInt(session.user.id);
    
    const profile = await prisma.companyProfile.findUnique({
      where: { user_id: userId },
      include: { user: { select: { name: true, email: true } } }
    });

    if (!profile) {
      return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/profiles/company
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
    const { company_name, industry, description, location, website } = body;

    // Check if company profile already exists
    const existingProfile = await prisma.companyProfile.findUnique({
      where: { user_id: userId }
    });

    if (existingProfile) {
      return NextResponse.json({ error: "Company profile already exists" }, { status: 400 });
    }

    // Create company profile
    const newProfile = await prisma.companyProfile.create({
      data: {
        user_id: userId,
        company_name,
        industry,
        description,
        location,
        website
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Company profile created successfully",
      profile: newProfile 
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating company profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/profiles/company
export async function PATCH(request: NextRequest) {
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
    const { company_name, industry, description, location, website } = body;

    // Update company profile
    const updatedProfile = await prisma.companyProfile.update({
      where: { user_id: userId },
      data: {
        company_name,
        industry,
        description,
        location,
        website
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Company profile updated successfully",
      profile: updatedProfile 
    });
  } catch (error) {
    console.error("Error updating company profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}