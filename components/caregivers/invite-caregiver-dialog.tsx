"use client"

import type React from "react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function InviteCaregiverDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [relationshipType, setRelationshipType] = useState("family")
  const [isMPOA, setIsMPOA] = useState(false)
  const [accessLevel, setAccessLevel] = useState("view")
  const [permissions, setPermissions] = useState({
    canViewRecords: true,
    canMessage: true,
    canSchedule: false,
    canManageMedications: false,
  })
  const [message, setMessage] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Get current user's patient ID
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()

      if (!patient) throw new Error("Patient profile not found")

      // Create caregiver invitation
      const { error } = await supabase.from("caregiver_invitations").insert({
        patient_id: patient.id,
        email: email.toLowerCase().trim(),
        relationship_type: relationshipType,
        is_mpoa: isMPOA,
        access_level: accessLevel,
        can_view_records: permissions.canViewRecords,
        can_message: permissions.canMessage,
        can_schedule: permissions.canSchedule,
        can_manage_medications: permissions.canManageMedications,
        message: message.trim() || null,
        invited_by: user.id,
      })

      if (error) throw error

      toast({
        title: "Invitation Sent",
        description: `Caregiver invitation sent to ${email}`,
      })

      // Reset form
      setEmail("")
      setRelationshipType("family")
      setIsMPOA(false)
      setAccessLevel("view")
      setPermissions({
        canViewRecords: true,
        canMessage: true,
        canSchedule: false,
        canManageMedications: false,
      })
      setMessage("")
      setOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Caregiver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite a Caregiver</DialogTitle>
            <DialogDescription>
              Invite a family member or caregiver to help manage your care. They'll receive an email invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="caregiver@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger id="relationship">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family Member</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="professional">Professional Caregiver</SelectItem>
                  <SelectItem value="mpoa">Medical Power of Attorney</SelectItem>
                  <SelectItem value="guardian">Legal Guardian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="mpoa" checked={isMPOA} onCheckedChange={(checked) => setIsMPOA(checked as boolean)} />
              <Label htmlFor="mpoa" className="text-sm font-normal">
                This person is my Medical Power of Attorney (MPOA)
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="access">Access Level</Label>
              <Select value={accessLevel} onValueChange={setAccessLevel}>
                <SelectTrigger id="access">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="manage">Manage Care</SelectItem>
                  <SelectItem value="full">Full Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label>Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="view-records"
                    checked={permissions.canViewRecords}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, canViewRecords: checked as boolean })
                    }
                  />
                  <Label htmlFor="view-records" className="text-sm font-normal">
                    View medical records and visit notes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="message"
                    checked={permissions.canMessage}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, canMessage: checked as boolean })}
                  />
                  <Label htmlFor="message" className="text-sm font-normal">
                    Send and receive messages with care team
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="schedule"
                    checked={permissions.canSchedule}
                    onCheckedChange={(checked) => setPermissions({ ...permissions, canSchedule: checked as boolean })}
                  />
                  <Label htmlFor="schedule" className="text-sm font-normal">
                    Schedule and reschedule visits
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="medications"
                    checked={permissions.canManageMedications}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, canManageMedications: checked as boolean })
                    }
                  />
                  <Label htmlFor="medications" className="text-sm font-normal">
                    Manage medication reminders
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to your invitation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email}>
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
