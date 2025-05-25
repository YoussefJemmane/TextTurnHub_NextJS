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
      sustainability_importance,
    } = body;

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
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
        if (!company_name) {
          throw new Error("Company name is required for company registration");
        }

        await tx.companyProfile.create({
          data: {
            user_id: newUser.id,
            company_name,
            company_size: company_size || null,
            waste_types: waste_types ? JSON.stringify(waste_types) : null,
            industry: "",
            description: "",
            location: "",
            website: "",
          },
        });
      } else if (role === "artisan") {
        if (!artisan_specialty || !artisan_experience) {
          throw new Error(
            "Specialty and experience are required for artisan registration"
          );
        }

        await tx.artisanProfile.create({
          data: {
            user_id: newUser.id,
            artisan_specialty,
            artisan_experience,
            materials_interest: materials_interest
              ? JSON.stringify(materials_interest)
              : null,
          },
        });
      } else if (role === "user") {
        await tx.userProfile.create({
          data: {
            user_id: newUser.id,
            interests: interests ? JSON.stringify(interests) : null,
            sustainability_importance: sustainability_importance || null,
            bio: "",
            location: "",
          },
        });
      } else {
        throw new Error("Invalid role specified");
      }

      return newUser;
    });

    // Return success without sensitive data
    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle known errors with specific messages
    if (error instanceof Error) {
      if (error.message.includes("required")) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during registration",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    );
  }
}
