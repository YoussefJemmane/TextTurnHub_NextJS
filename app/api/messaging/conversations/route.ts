import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET /api/messaging/conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    
    // Get all conversations the user is part of
    const conversations = await prisma.conversation.findMany({
      where: {
        users: {
          some: {
            user_id: userId
          }
        }
      },
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
            created_at: "desc"
          },
          take: 1
        }
      },
      orderBy: {
        updated_at: "desc"
      }
    });

    // Format the response to be more client-friendly
    const formattedConversations = conversations.map(conv => {
      // Filter out the current user from the participants
      const otherParticipants = conv.users
        .filter(u => u.user_id !== userId)
        .map(u => u.user);
      
      // Get the last message if available
      const lastMessage = conv.messages.length > 0 ? conv.messages[0] : null;
      
      return {
        id: conv.id,
        title: conv.title || otherParticipants.map(p => p.name).join(", "),
        participants: otherParticipants,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          sender_id: lastMessage.sender_id,
          created_at: lastMessage.created_at
        } : null,
        created_at: conv.created_at,
        updated_at: conv.updated_at
      };
    });

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/messaging/conversations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { recipient_id, title, initial_message } = body;
    
    if (!recipient_id) {
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 });
    }
    
    if (!initial_message) {
      return NextResponse.json({ error: "Initial message is required" }, { status: 400 });
    }

    const recipientId = parseInt(recipient_id);
    
    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    });

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Check if a conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            users: {
              some: {
                user_id: userId
              }
            }
          },
          {
            users: {
              some: {
                user_id: recipientId
              }
            }
          }
        ]
      },
      include: {
        users: true
      }
    });

    let conversationId;
    
    if (existingConversation) {
      // Use existing conversation
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const newConversation = await prisma.conversation.create({
        data: {
          title,
          users: {
            create: [
              { user_id: userId },
              { user_id: recipientId }
            ]
          }
        }
      });
      
      conversationId = newConversation.id;
    }

    // Add the message to the conversation
    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content: initial_message
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: "Conversation created successfully",
      conversation_id: conversationId,
      message_id: message.id
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}