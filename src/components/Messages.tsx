import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<{
    listingId: Id<"listings">;
    otherUserId: Id<"users">;
  } | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const conversations = useQuery(api.messages.getUserConversations);
  const messages = useQuery(
    api.messages.getConversation,
    selectedConversation
      ? {
          listingId: selectedConversation.listingId,
          otherUserId: selectedConversation.otherUserId,
        }
      : "skip"
  );
  const sendMessage = useMutation(api.messages.sendMessage);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) {
      return;
    }

    try {
      await sendMessage({
        listingId: selectedConversation.listingId,
        receiverId: selectedConversation.otherUserId,
        content: newMessage.trim(),
      });
      
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Communicate with renters and listers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>
          
          <div className="overflow-y-auto h-full">
            {conversations ? (
              conversations.length > 0 ? (
                conversations.map((conv) => (
                  <button
                    key={`${conv.listingId}-${conv.otherUserId}`}
                    onClick={() =>
                      setSelectedConversation({
                        listingId: conv.listingId as Id<"listings">,
                        otherUserId: conv.otherUserId as Id<"users">,
                      })
                    }
                    className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                      selectedConversation?.listingId === conv.listingId &&
                      selectedConversation?.otherUserId === conv.otherUserId
                        ? "bg-rose-50 border-rose-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {conv.otherUser?.name?.[0] || conv.otherUser?.email?.[0] || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {conv.otherUser?.name || "Anonymous"}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {conv.listing?.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {conv.lastMessage.content}
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <div className="text-gray-600">No conversations yet</div>
                </div>
              )
            ) : (
              <div className="p-4">
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="font-semibold text-gray-900">
                  {conversations?.find(
                    (c) =>
                      c.listingId === selectedConversation.listingId &&
                      c.otherUserId === selectedConversation.otherUserId
                  )?.otherUser?.name || "Anonymous"}
                </div>
                <div className="text-sm text-gray-600">
                  About: {conversations?.find(
                    (c) =>
                      c.listingId === selectedConversation.listingId &&
                      c.otherUserId === selectedConversation.otherUserId
                  )?.listing?.title}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages ? (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${
                        message.senderId === loggedInUser?._id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.senderId === loggedInUser?._id
                            ? "bg-rose-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            message.senderId === loggedInUser?._id
                              ? "text-rose-100"
                              : "text-gray-500"
                          }`}
                        >
                          {new Date(message._creationTime).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                      >
                        <div className="h-12 bg-gray-200 rounded-2xl w-48 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <div className="text-gray-600">Select a conversation to start chatting</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
