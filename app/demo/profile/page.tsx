"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function DemoProfilePage() {
  const mockProfile = {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    role: "patient",
    phone: "(555) 123-4567",
    date_of_birth: "1955-03-15",
    address: "123 Main Street",
    city: "Springfield",
    state: "IL",
    zip_code: "62701",
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
                {mockProfile.first_name} {mockProfile.last_name}
              </p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{mockProfile.email}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Role</Label>
              <div>
                <Badge variant="secondary">{getRoleLabel(mockProfile.role)}</Badge>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{mockProfile.phone}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Date of Birth</Label>
              <p className="font-medium">{new Date(mockProfile.date_of_birth).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Street Address</Label>
              <p className="font-medium">{mockProfile.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground">City</Label>
                <p className="font-medium">{mockProfile.city}</p>
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">State</Label>
                <p className="font-medium">{mockProfile.state}</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">ZIP Code</Label>
              <p className="font-medium">{mockProfile.zip_code}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
