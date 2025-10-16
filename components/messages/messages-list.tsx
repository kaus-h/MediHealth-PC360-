"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Inbox } from "lucide-react"
import { MessageThread } from "./message-thread"
import type { Message } from "@/lib/types/database"

interface MessagesListProps {
  receivedMessages: (Message & {
    sender?: { id: string; first_name: string; last_name: string; role: string }
    recipient?: { id: string; first_name: string; last_name: string; role: string }
  })[]
  sentMessages: (Message & {
    sender?: { id: string; first_name: string; last_name: string; role: string }
    recipient?: { id: string; first_name: string; last_name: string; role: string }
  })[]
  currentUserId: string
}

export function MessagesList({ receivedMessages, sentMessages, currentUserId }: MessagesListProps) {
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const MessageCard = ({ message, isSent }: { message: any; isSent: boolean }) => {
    const otherPerson = isSent ? message.recipient : message.sender

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedMessage(message)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-100 p-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">
                      {isSent ? "To: " : "From: "}
                      {otherPerson ? `${otherPerson.first_name} ${otherPerson.last_name}` : "Unknown"}
                    </p>
                    <span className="text-xs text-muted-foreground">{formatDate(message.created_at)}</span>
                  </div>
                  {message.subject && <p className="text-sm font-medium mt-1">{message.subject}</p>}
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{message.body}</p>
                </div>
              </div>
            </div>
            {!isSent && !message.is_read && (
              <Badge variant="default" className="shrink-0">
                New
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (selectedMessage) {
    return (
      <MessageThread message={selectedMessage} currentUserId={currentUserId} onBack={() => setSelectedMessage(null)} />
    )
  }

  const unreadCount = receivedMessages.filter((m) => !m.is_read).length

  return (
    <Tabs defaultValue="inbox" className="space-y-6">
      <TabsList>
        <TabsTrigger value="inbox" className="gap-2">
          <Inbox className="h-4 w-4" />
          Inbox
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="sent" className="gap-2">
          <Send className="h-4 w-4" />
          Sent
        </TabsTrigger>
      </TabsList>

      <TabsContent value="inbox" className="space-y-4">
        {receivedMessages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-sm text-muted-foreground">Your inbox is empty</p>
            </CardContent>
          </Card>
        ) : (
          receivedMessages.map((message) => <MessageCard key={message.id} message={message} isSent={false} />)
        )}
      </TabsContent>

      <TabsContent value="sent" className="space-y-4">
        {sentMessages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sent messages</h3>
              <p className="text-sm text-muted-foreground">Messages you send will appear here</p>
            </CardContent>
          </Card>
        ) : (
          sentMessages.map((message) => <MessageCard key={message.id} message={message} isSent={true} />)
        )}
      </TabsContent>
    </Tabs>
  )
}
