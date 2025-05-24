import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// POST /api/messaging/messages
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { conversation_id, content } = body;
    
    if (!conversation_id) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }
    
    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const conversationId = parseInt(conversation_id);
    
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

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: {
        id: message.id,
        content: message.content,
        sender: message.sender,
        created_at: message.created_at
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}