"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Calendar, MessageSquare, FileText, Activity, AlertCircle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Notification } from "@/lib/types/database"
import { useToast } from "@/hooks/use-toast"

interface NotificationsListProps {
  notifications: Notification[]
  userId: string
}

export function NotificationsList({ notifications, userId }: NotificationsListProps) {
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, any> = {
      visit_reminder: Calendar,
      visit_update: Calendar,
      message: MessageSquare,
      document: FileText,
      care_plan_update: Activity,
      system: Bell,
    }
    return icons[type] || Bell
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      normal: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }
    return colors[priority] || "bg-gray-100 text-gray-800"
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
      toast({
        title: "Action Failed",
        description: "Unable to mark notification as read. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true)
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (error) throw error

      toast({
        title: "All Marked as Read",
        description: "All notifications have been marked as read.",
        variant: "default",
      })

      router.refresh()
    } catch (error) {
      console.error("[v0] Error marking all notifications as read:", error)
      toast({
        title: "Action Failed",
        description: "Unable to mark all notifications as read. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = getNotificationIcon(notification.type)

    return (
      <Card
        className={`cursor-pointer hover:shadow-md transition-shadow ${!notification.is_read ? "border-l-4 border-l-blue-500" : ""}`}
        onClick={() => handleNotificationClick(notification)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`rounded-lg p-2 ${notification.is_read ? "bg-gray-100" : "bg-blue-100"}`}>
              <Icon className={`h-5 w-5 ${notification.is_read ? "text-gray-600" : "text-blue-600"}`} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-semibold text-sm ${!notification.is_read ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {notification.title}
                    </h3>
                    {notification.priority !== "normal" && (
                      <Badge variant="secondary" className={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(notification.created_at)}
                </span>
              </div>
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMarkAsRead(notification.id)
                  }}
                >
                  Mark as read
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read)
  const readNotifications = notifications.filter((n) => n.is_read)

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
          <p className="text-sm text-muted-foreground">
            You&apos;ll receive notifications about visits, messages, and care updates here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {unreadNotifications.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="gap-2 bg-transparent"
          >
            <CheckCircle className="h-4 w-4" />
            {isMarkingAllRead ? "Marking all as read..." : "Mark all as read"}
          </Button>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
          <TabsTrigger value="read">Read ({readNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-sm text-muted-foreground">You have no unread notifications</p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No read notifications</h3>
                <p className="text-sm text-muted-foreground">Notifications you&apos;ve read will appear here</p>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
