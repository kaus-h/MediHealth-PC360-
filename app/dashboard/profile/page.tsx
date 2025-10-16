import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      patient: "Patient",
      caregiver: "Family Caregiver",
      clinician: "Clinician",
      agency_admin: "Agency Administrator",
      vendor: "Vendor",
    }
    return labels[role] || role
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="font-medium">
                {profile.first_name} {profile.last_name}
              </p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{profile.email}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Role</Label>
              <div>
                <Badge variant="secondary">{getRoleLabel(profile.role)}</Badge>
              </div>
            </div>
            {profile.phone && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{profile.phone}</p>
              </div>
            )}
            {profile.date_of_birth && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Date of Birth</Label>
                <p className="font-medium">{new Date(profile.date_of_birth).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {(profile.address || profile.city || profile.state) && (
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.address && (
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Street Address</Label>
                  <p className="font-medium">{profile.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {profile.city && (
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">City</Label>
                    <p className="font-medium">{profile.city}</p>
                  </div>
                )}
                {profile.state && (
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground">State</Label>
                    <p className="font-medium">{profile.state}</p>
                  </div>
                )}
              </div>
              {profile.zip_code && (
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">ZIP Code</Label>
                  <p className="font-medium">{profile.zip_code}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
