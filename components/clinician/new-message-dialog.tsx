"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface NewMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patients: Patient[]
  currentUserId: string
}

export function NewMessageDialog({ open, onOpenChange, patients, currentUserId }: NewMessageDialogProps) {
  const [recipientId, setRecipientId] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSend = async () => {
    if (!recipientId || !body) {
      toast({
        title: "Missing Information",
        description: "Please select a recipient and enter a message",
        variant: "destructive",
      })
      return
    }

    setSending(true)

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      recipient_id: recipientId,
      subject: subject || null,
      body,
      is_read: false,
    })

    setSending(false)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      })
      setRecipientId("")
      setSubject("")
      setBody("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>Send a secure message to a patient</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} ({patient.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject (Optional)</Label>
            <Input
              id="subject"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Enter your message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
