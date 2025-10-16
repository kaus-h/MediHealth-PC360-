"use client"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { MessagesList } from "@/components/messages/messages-list"
import { useToast } from "@/hooks/use-toast"

export default function DemoMessagesPage() {
  const { toast } = useToast()

  const mockReceivedMessages = [
    {
      id: "1",
      sender_id: "clinician-1",
      recipient_id: "demo-user",
      subject: "Upcoming Visit Reminder",
      body: "Hi! Just a friendly reminder about your nursing visit scheduled for this Thursday at 10:00 AM. Please make sure someone is home to let me in. Looking forward to seeing you!",
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sender: {
        id: "clinician-1",
        first_name: "Sarah",
        last_name: "Johnson",
        role: "clinician",
      },
    },
    {
      id: "2",
      sender_id: "clinician-2",
      recipient_id: "demo-user",
      subject: "Physical Therapy Progress",
      body: "Great work during today's session! I've noticed significant improvement in your mobility. Keep up with the home exercises we discussed. See you next week!",
      is_read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      sender: {
        id: "clinician-2",
        first_name: "Michael",
        last_name: "Chen",
        role: "clinician",
      },
    },
  ]

  const mockSentMessages = [
    {
      id: "3",
      sender_id: "demo-user",
      recipient_id: "clinician-1",
      subject: "Question about medication",
      body: "Hi Sarah, I had a question about the new medication you prescribed. Should I take it with food or on an empty stomach? Thanks!",
      is_read: true,
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      recipient: {
        id: "clinician-1",
        first_name: "Sarah",
        last_name: "Johnson",
        role: "clinician",
      },
    },
  ]

  const handleNewMessage = () => {
    toast({
      title: "Demo Mode",
      description: "This feature is available for authenticated users. Please sign up or log in to send messages.",
      variant: "default",
    })
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">Secure HIPAA-compliant communication with your care team</p>
        </div>
        <Button onClick={handleNewMessage}>
          <MessageSquare className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <MessagesList receivedMessages={mockReceivedMessages} sentMessages={mockSentMessages} currentUserId="demo-user" />
    </div>
  )
}
