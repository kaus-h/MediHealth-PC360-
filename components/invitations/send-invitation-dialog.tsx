"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { UserPlus, Loader2 } from "lucide-react"

interface SendInvitationDialogProps {
  userRole: "patient" | "clinician"
  userId: string
  patientId?: string
  clinicianId?: string
}

export function SendInvitationDialog({ userRole, userId, patientId, clinicianId }: SendInvitationDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const invitationType = userRole === "patient" ? "patient_to_clinician" : "clinician_to_patient"
  const inviteeRole = userRole === "patient" ? "clinician" : "patient"

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      let finalPatientId = patientId
      let finalClinicianId = clinicianId

      // If user is a patient and doesn't have a patient record, create one
      if (userRole === "patient" && !patientId) {
        const { data: newPatient, error: patientError } = await supabase
          .from("patients")
          .insert({
            profile_id: userId,
            status: "active",
          })
          .select("id")
          .single()

        if (patientError) {
          console.error("[v0] Error creating patient record:", patientError)
          throw new Error("Failed to create patient record")
        }

        finalPatientId = newPatient.id
        console.log("[v0] Created patient record:", finalPatientId)
      }

      // If user is a clinician and doesn't have a clinician record, create one
      if (userRole === "clinician" && !clinicianId) {
        const { data: newClinician, error: clinicianError } = await supabase
          .from("clinicians")
          .insert({
            profile_id: userId,
            specialization: "General Practice",
            license_number: "PENDING",
          })
          .select("id")
          .single()

        if (clinicianError) {
          console.error("[v0] Error creating clinician record:", clinicianError)
          throw new Error("Failed to create clinician record")
        }

        finalClinicianId = newClinician.id
        console.log("[v0] Created clinician record:", finalClinicianId)
      }

      // Check if user with this email exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role, email, first_name, last_name")
        .eq("email", email.toLowerCase())
        .single()

      // Verify the user has the correct role
      if (existingProfile && existingProfile.role !== inviteeRole) {
        toast({
          title: "Invalid user role",
          description: `This email belongs to a ${existingProfile.role}, not a ${inviteeRole}`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from("invitations")
        .select("id, status")
        .eq("inviter_id", userId)
        .eq("invitee_email", email.toLowerCase())
        .eq("status", "pending")
        .single()

      if (existingInvitation) {
        toast({
          title: "Invitation already sent",
          description: "You have already sent an invitation to this email",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const { error: invitationError } = await supabase.from("invitations").insert({
        inviter_id: userId,
        invitee_email: email.toLowerCase(),
        invitee_id: existingProfile?.id || null,
        invitation_type: invitationType,
        patient_id: finalPatientId || null,
        clinician_id: finalClinicianId || null,
        message: message.trim() || null,
        status: "pending",
      })

      if (invitationError) throw invitationError

      // Create notification for invitee if they exist
      if (existingProfile) {
        await supabase.from("notifications").insert({
          user_id: existingProfile.id,
          title: "New Invitation",
          message: `You have received an invitation from a ${userRole}`,
          type: "system",
          priority: "normal",
          action_url: "/dashboard/invitations",
        })
      }

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${email}`,
      })

      setOpen(false)
      setEmail("")
      setMessage("")

      // Reload the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite {inviteeRole === "clinician" ? "Clinician" : "Patient"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite {inviteeRole === "clinician" ? "a Clinician" : "a Patient"}</DialogTitle>
          <DialogDescription>
            Send an invitation to connect with {inviteeRole === "clinician" ? "a clinician" : "a patient"} on
            MediHealth.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder={`${inviteeRole}@example.com`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSendInvitation} disabled={isLoading} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
