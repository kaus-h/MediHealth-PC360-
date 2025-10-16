"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface MessageThreadProps {
  message: any
  currentUserId: string
  onBack: () => void
}

export function MessageThread({ message, currentUserId, onBack }: MessageThreadProps) {
  const [replyBody, setReplyBody] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isSent = message.sender_id === currentUserId
  const otherPerson = isSent ? message.recipient : message.sender

  const handleSendReply = async () => {
    if (!replyBody.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setShowLoginDialog(true)
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        recipient_id: otherPerson.id,
        subject: `Re: ${message.subject || "No subject"}`,
        body: replyBody,
        parent_message_id: message.id,
        patient_context_id: message.patient_context_id,
      })

      if (error) throw error

      // Mark original message as read if it was received
      if (!isSent && !message.is_read) {
        await supabase
          .from("messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("id", message.id)
      }

      setReplyBody("")
      router.refresh()
      onBack()
    } catch (error) {
      console.error("[v0] Error sending reply:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginRedirect = () => {
    router.push("/auth/login")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Messages
      </Button>

      <Card>
        <CardHeader>
          <div className="space-y-2">
            <CardTitle>{message.subject || "No subject"}</CardTitle>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {isSent ? "To: " : "From: "}
                {otherPerson ? `${otherPerson.first_name} ${otherPerson.last_name}` : "Unknown"}
              </span>
              <span>{formatDate(message.created_at)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{message.body}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reply</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Type your reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={6}
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <Button onClick={handleSendReply} disabled={isLoading || !replyBody.trim()} className="gap-2">
              <Send className="h-4 w-4" />
              {isLoading ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to send messages. Please log in to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginRedirect}>Go to Login</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
