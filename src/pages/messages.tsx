import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import Navbar from "@/components/navbar";
import type { Conversation, Message, User } from "@/types/schema";

interface ConversationWithDetails extends Conversation {
  otherParticipant: User & { provider?: any };
  lastMessage?: Message;
  unreadCount?: number;
}

interface MessageWithSender extends Message {
  sender: User;
}

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useQuery({
    queryKey: ["/api/conversations"],
    retry: false,
  });

  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${selectedConversation}/messages`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!selectedConversation,
    retry: false,
  });

  const { data: unreadCount = { count: 0 } } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      return await apiRequest(`/api/conversations/${data.conversationId}/messages`, "POST", { content: data.content });
    },
    onSuccess: () => {
      setMessageContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest("PUT", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error) => {
      console.error('Failed to mark message as read:', error);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg: MessageWithSender) => !msg.isRead && msg.senderId !== '43778848'
      );
      
      unreadMessages.forEach((msg: MessageWithSender) => {
        try {
          markAsReadMutation.mutate(msg.id);
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });
    }
  }, [selectedConversation, messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageContent.trim(),
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  if (conversationsLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center">Loading conversations...</div>
        </div>
      </>
    );
  }

  if (conversationsError) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center text-red-500">
            Error loading conversations: {conversationsError.message}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        {unreadCount.count > 0 && (
          <Badge variant="destructive">
            {unreadCount.count} unread message{unreadCount.count !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conversation: ConversationWithDetails) => {
                    const hasUnread = conversation.unreadCount && conversation.unreadCount > 0;
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          try {
                            setSelectedConversation(conversation.id);
                          } catch (error) {
                            console.error('Error selecting conversation:', error);
                          }
                        }}
                        className={`p-4 cursor-pointer hover:bg-muted/50 border-b transition-colors ${
                          selectedConversation === conversation.id ? "bg-muted" : ""
                        } ${hasUnread ? "bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={conversation.otherParticipant?.profileImageUrl || undefined} 
                                alt={conversation.otherParticipant?.firstName || "User"} 
                              />
                              <AvatarFallback>
                                {conversation.otherParticipant?.firstName?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            {hasUnread && (
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`truncate ${hasUnread ? "font-semibold" : "font-medium"}`}>
                              {conversation.otherParticipant?.provider?.businessName || 
                               `${conversation.otherParticipant?.firstName} ${conversation.otherParticipant?.lastName}`}
                            </div>
                            {conversation.lastMessage && (
                              <div className={`text-sm truncate ${hasUnread ? "text-gray-900 font-medium" : "text-muted-foreground"}`}>
                                {conversation.lastMessage.content}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {conversation.lastMessage && (
                              <div className="text-xs text-muted-foreground">
                                {formatTime(conversation.lastMessage.createdAt!)}
                              </div>
                            )}
                            {hasUnread && (
                              <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-xs px-2 py-1">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Messages View */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle>
                      {(() => {
                        const conversation = conversations.find((c: ConversationWithDetails) => c.id === selectedConversation);
                        const participant = conversation?.otherParticipant;
                        return participant?.provider?.businessName || 
                               `${participant?.firstName} ${participant?.lastName}`;
                      })()}
                    </CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="text-center">Loading messages...</div>
                    ) : messagesError ? (
                      <div className="text-center text-red-500">
                        Error loading messages: {messagesError.message}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message: MessageWithSender, index: number) => {
                          const isCurrentUser = message.senderId === '43778848';
                          const showDate = index === 0 || 
                            formatDate(message.createdAt!) !== formatDate(messages[index - 1]?.createdAt!);

                          return (
                            <div key={message.id}>
                              {showDate && (
                                <div className="text-center text-xs text-muted-foreground my-2">
                                  {formatDate(message.createdAt!)}
                                </div>
                              )}
                              <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                                <div
                                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                    isCurrentUser
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  <div className="text-sm">{message.content}</div>
                                  <div
                                    className={`text-xs mt-1 ${
                                      isCurrentUser
                                        ? "text-primary-foreground/70"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {formatTime(message.createdAt!)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  <Separator />

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4">
                    <div className="flex gap-2">
                      <Input
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button
                        type="submit"
                        disabled={!messageContent.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}