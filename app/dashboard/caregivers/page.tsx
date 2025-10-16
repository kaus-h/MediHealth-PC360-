import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InviteCaregiverDialog } from "@/components/caregivers/invite-caregiver-dialog"
import { Shield, Mail, Calendar, FileText, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default async function CaregiversPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get patient ID
  const { data: patient } = await supabase.from("accessible_patients").select("id").eq("profile_id", user.id).single()

  if (!patient) redirect("/dashboard")

  // Get caregivers
  const { data: caregivers } = await supabase
    .from("patient_caregivers")
    .select(`
      *,
      caregiver:caregivers!patient_caregivers_caregiver_id_fkey(
        *,
        profile:profiles!caregivers_profile_id_fkey(
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq("patient_id", patient.id)
    .is("revoked_at", null)

  // Get pending invitations
  const { data: pendingInvitations } = await supabase
    .from("caregiver_invitations")
    .select("*")
    .eq("patient_id", patient.id)
    .eq("status", "pending")
    .order("invited_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">My Caregivers</h1>
          <p className="text-muted-foreground mt-1">Manage family members and caregivers who help with your care</p>
        </div>
        <InviteCaregiverDialog />
      </div>

      {/* Active Caregivers */}
      <div className="grid gap-4">
        <h2 className="text-xl font-semibold">Active Caregivers</h2>
        {caregivers && caregivers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {caregivers.map((pc: any) => (
              <Card key={pc.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {pc.caregiver.profile.first_name} {pc.caregiver.profile.last_name}
                        {pc.caregiver.is_mpoa && (
                          <Badge variant="default" className="gap-1">
                            <Shield className="h-3 w-3" />
                            MPOA
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{pc.caregiver.profile.email}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Revoke Access</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{pc.access_level}</Badge>
                      <span className="text-muted-foreground capitalize">{pc.caregiver.relationship_type}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {pc.can_view_records && (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          View Records
                        </Badge>
                      )}
                      {pc.can_message && (
                        <Badge variant="secondary" className="gap-1">
                          <Mail className="h-3 w-3" />
                          Messaging
                        </Badge>
                      )}
                      {pc.can_schedule && (
                        <Badge variant="secondary" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          Scheduling
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Access granted {new Date(pc.granted_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                No caregivers added yet. Invite a family member or caregiver to help manage your care.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Pending Invitations</h2>
          <div className="grid gap-3">
            {pendingInvitations.map((invitation: any) => (
              <Card key={invitation.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited {new Date(invitation.invited_at).toLocaleDateString()} • Expires{" "}
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
