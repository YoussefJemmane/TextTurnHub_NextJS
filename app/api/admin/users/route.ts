import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('admin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pagination parameters from query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build search conditions
    const searchCondition = search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    } : {};

    // Fetch users with their roles
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: searchCondition,
        include: {
          roles: {
            include: {
              role: true
            }
          },
          userProfile: true,
          companyProfile: true,
          artisanProfile: true,
        },
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.user.count({
        where: searchCondition
      })
    ]);

    // Transform user data to include role names
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles.map(ur => ur.role.name),
      created_at: user.created_at,
      profile_type: user.companyProfile ? 'company' : user.artisanProfile ? 'artisan' : 'user',
      profile: user.companyProfile || user.artisanProfile || user.userProfile
    }));

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('admin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.password || !body.name || !body.roles) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create user and assign roles in a transaction
    const user = await prisma.$transaction(async (prisma) => {
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          password: hashedPassword,
        }
      });

      // Assign roles
      for (const roleName of body.roles) {
        const role = await prisma.role.findUnique({
          where: { name: roleName }
        });
        if (role) {
          await prisma.userRole.create({
            data: {
              user_id: newUser.id,
              role_id: role.id
            }
          });
        }
      }

      return newUser;
    });

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: body.roles
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('admin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = parseInt(params.id);

    // Update user in a transaction
    await prisma.$transaction(async (prisma) => {
      // Update basic user info
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: body.name,
          email: body.email,
          // Only update password if provided
          ...(body.password && {
            password: await bcrypt.hash(body.password, 10)
          })
        }
      });

      // Update roles if provided
      if (body.roles) {
        // Remove existing roles
        await prisma.userRole.deleteMany({
          where: { user_id: userId }
        });

        // Add new roles
        for (const roleName of body.roles) {
          const role = await prisma.role.findUnique({
            where: { name: roleName }
          });
          if (role) {
            await prisma.userRole.create({
              data: {
                user_id: userId,
                role_id: role.id
              }
            });
          }
        }
      }
    });

    return NextResponse.json({
      message: "User updated successfully"
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('admin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(params.id);

    // Delete user (will cascade to related records due to Prisma schema setup)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

