import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      role,
      company_name,
      company_size,
      waste_types,
      artisan_specialty,
      artisan_experience,
      materials_interest,
      interests,
      sustainability_importance
    } = body;

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create base user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Get role
      const roleRecord = await tx.role.findUnique({
        where: { name: role },
      });

      if (!roleRecord) {
        throw new Error("Invalid role specified");
      }

      // Assign role
      await tx.userRole.create({
        data: {
          user_id: newUser.id,
          role_id: roleRecord.id,
        },
      });

      // Create profile based on role
      if (role === "company") {
        await tx.companyProfile.create({
          data: {
            user_id: newUser.id,
            company_name: company_name || "",
            industry: "",  // Add default value
            description: "", // Add default value
            location: "", // Add default value
            website: "", // Add default value
            company_size: company_size || "",
            waste_types: waste_types ? JSON.stringify(waste_types) : null,
          },
        });
      } else if (role === "artisan") {
        await tx.artisanProfile.create({
          data: {
            user_id: newUser.id,
            artisan_specialty: artisan_specialty || "",
            artisan_experience: artisan_experience || "",
            materials_interest: materials_interest ? JSON.stringify(materials_interest) : null,
          },
        });
      } else {
        await tx.userProfile.create({
          data: {
            user_id: newUser.id,
            interests: interests ? JSON.stringify(interests) : null,
            sustainability_importance: sustainability_importance || null,
          },
        });
      }

      return newUser;
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error details:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "An error occurred during registration",
        error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}
