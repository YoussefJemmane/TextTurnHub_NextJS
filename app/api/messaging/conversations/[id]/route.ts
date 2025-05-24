import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/messaging/conversations/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const conversationId = parseInt(params.id);
    
    // Check if user is part of this conversation
    const userInConversation = await prisma.conversationUser.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId
        }
      }
    });

    if (!userInConversation) {
      return NextResponse.json({ error: "Forbidden: You're not part of this conversation" }, { status: 403 });
    }

    // Get conversation with participants and messages
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            created_at: "asc"
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Format the response
    const otherParticipants = conversation.users
      .filter(u => u.user_id !== userId)
      .map(u => u.user);
    
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title || otherParticipants.map(p => p.name).join(", "),
      participants: conversation.users.map(u => u.user),
      messages: conversation.messages.map(message => ({
        id: message.id,
        content: message.content,
        sender: message.sender,
        created_at: message.created_at,
        read_at: message.read_at
      })),
      created_at: conversation.created_at,
      updated_at: conversation.updated_at
    };

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId },
        read_at: null
      },
      data: {
        read_at: new Date()
      }
    });

    return NextResponse.json({ conversation: formattedConversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}