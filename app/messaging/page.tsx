"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    name: string;
  };
  created_at: string;
  read_at: string | null;
}

interface Conversation {
  id: number;
  title: string;
  participants: User[];
  lastMessage: {
    id: number;
    content: string;
    sender_id: number;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface ConversationDetail {
  id: number;
  title: string;
  participants: User[];
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export default function MessagingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    
    // Fetch conversations
    fetchConversations();
  }, [session, status, router]);

  useEffect(() => {
    // Scroll to bottom of messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messaging/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      } else {
        setError("Failed to load conversations");
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("An error occurred while loading conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (id: number) => {
    try {
      const res = await fetch(`/api/messaging/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data.conversation);
      } else {
        setError("Failed to load conversation");
      }
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setError("An error occurred while loading the conversation");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation) return;

    try {
      const res = await fetch("/api/messaging/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: message,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Update the conversation with the new message
        setSelectedConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, data.data],
          };
        });
        
        // Update the conversations list with the new last message
        setConversations((prevConversations) => {
          return prevConversations.map((conv) => {
            if (conv.id === selectedConversation.id) {
              return {
                ...conv,
                lastMessage: {
                  id: data.data.id,
                  content: data.data.content,
                  sender_id: parseInt(session?.user?.id || "0"),
                  created_at: data.data.created_at,
                },
                updated_at: new Date().toISOString(),
              };
            }
            return conv;
          }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        });
        
        // Clear the message input
        setMessage("");
      } else {
        setError("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("An error occurred while sending the message");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh]">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          {/* Conversations list */}
          <div className="border-r border-gray-200 md:col-span-1">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold">Conversations</h2>
            </div>
            
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No conversations yet.</p>
                <p className="mt-2">
                  <Link href="/marketplace" className="text-teal-600 hover:underline">
                    Browse the marketplace
                  </Link>
                  {" "}to connect with other users.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.id === conv.id ? "bg-gray-100" : ""
                    }`}
                    onClick={() => fetchConversation(conv.id)}
                  >
                    <div className="font-medium">{conv.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {conv.lastMessage ? (
                        <div className="truncate">{conv.lastMessage.content}</div>
                      ) : (
                        "No messages yet"
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {conv.lastMessage
                        ? formatDate(conv.lastMessage.created_at)
                        : formatDate(conv.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Messages area */}
          <div className="md:col-span-2 lg:col-span-3 flex flex-col h-[70vh]">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{selectedConversation.title}</h2>
                    <div className="text-sm text-gray-500">
                      {selectedConversation.participants
                        .filter((p) => p.id.toString() !== session?.user?.id)
                        .map((p) => p.name)
                        .join(", ")}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>No messages yet.</p>
                      <p>Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    selectedConversation.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender.id.toString() === session?.user?.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg p-3 ${
                            msg.sender.id.toString() === session?.user?.id
                              ? "bg-teal-100 text-teal-900"
                              : "bg-gray-100"
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">
                            {msg.sender.name}
                          </div>
                          <div>{msg.content}</div>
                          <div className="text-xs text-gray-500 mt-1 text-right">
                            {formatDate(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
                <div className="text-center">
                  <p className="mb-4">Select a conversation to view messages</p>
                  {conversations.length === 0 && (
                    <Link
                      href="/marketplace"
                      className="text-teal-600 hover:underline"
                    >
                      Browse the marketplace to connect with users
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}