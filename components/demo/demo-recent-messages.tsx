"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  subject: string
  body: string
  is_read: boolean
  created_at: string
  sender?: {
    first_name: string
    last_name: string
    role: string
  }
}

interface DemoRecentMessagesProps {
  messages: Message[]
}

export function DemoRecentMessages({ messages }: DemoRecentMessagesProps) {
  const router = useRouter()

  const handleViewAll = () => {
    router.push("/demo/messages")
  }

  const handleMessageClick = (messageId: string) => {
    router.push("/demo/messages")
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "clinician":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      case "admin":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Recent Messages
        </CardTitle>
        <Button variant="ghost" size="sm" className="gap-1" onClick={handleViewAll}>
          View All
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
        ) : (
          messages.slice(0, 5).map((message) => (
            <button
              key={message.id}
              onClick={() => handleMessageClick(message.id)}
              className="w-full text-left p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`font-semibold text-sm group-hover:text-primary transition-colors truncate ${!message.is_read ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {message.subject}
                    </h4>
                    {!message.is_read && (
                      <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  {message.sender && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {message.sender.first_name} {message.sender.last_name}
                      </p>
                      <Badge variant="outline" className={getRoleBadgeColor(message.sender.role)}>
                        {message.sender.role}
                      </Badge>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2">{message.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  )
}
