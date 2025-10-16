import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MessageSquare, ArrowRight } from "lucide-react"
import type { Message } from "@/lib/types/database"

interface RecentMessagesProps {
  messages: (Message & {
    sender?: {
      first_name: string
      last_name: string
      role: string
    }
  })[]
}

export function RecentMessages({ messages }: RecentMessagesProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      clinician: "bg-primary/10 text-primary",
      patient: "bg-accent/10 text-accent",
      caregiver: "bg-chart-4/10 text-chart-4",
    }
    return colors[role] || "bg-muted text-muted-foreground"
  }

  return (
    <Card className="border-border/50 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Recent Messages
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="gap-2 hover:text-primary group">
          <Link href="/dashboard/messages">
            View All
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="group flex items-start gap-3 rounded-xl border border-border/50 p-4 hover:bg-muted/30 hover:border-primary/30 transition-all duration-200"
              >
                <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-2.5 shrink-0 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>

                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {message.sender ? `${message.sender.first_name} ${message.sender.last_name}` : "Unknown"}
                      </p>
                      {message.sender && (
                        <Badge variant="secondary" className={`text-xs ${getRoleColor(message.sender.role)}`}>
                          {message.sender.role}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(message.created_at)}</span>
                  </div>

                  {message.subject && <p className="text-sm font-medium text-foreground truncate">{message.subject}</p>}

                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{message.body}</p>

                  {!message.is_read && (
                    <Badge variant="secondary" className="text-xs bg-accent/10 text-accent border-accent/20">
                      Unread
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
