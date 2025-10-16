import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Heart, Activity } from "lucide-react"

export default async function HealthRecordsPage() {
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

  // Fetch patient data
  let patientData = null
  if (profile.role === "patient") {
    const { data: patient } = await supabase.from("patients").select("*").eq("profile_id", user.id).single()
    patientData = patient
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Health Records</h1>
        <p className="text-muted-foreground mt-1">Access your medical information and care history</p>
      </div>

      {patientData ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patientData.medical_record_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Medical Record Number</p>
                  <p className="font-medium">{patientData.medical_record_number}</p>
                </div>
              )}
              {patientData.primary_diagnosis && (
                <div>
                  <p className="text-sm text-muted-foreground">Primary Diagnosis</p>
                  <p className="font-medium">{patientData.primary_diagnosis}</p>
                </div>
              )}
              {patientData.admission_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Admission Date</p>
                  <p className="font-medium">{new Date(patientData.admission_date).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="secondary" className="mt-1">
                  {patientData.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patientData.insurance_provider ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">{patientData.insurance_provider}</p>
                  </div>
                  {patientData.insurance_policy_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">Policy Number</p>
                      <p className="font-medium">{patientData.insurance_policy_number}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No insurance information on file</p>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patientData.emergency_contact_name ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{patientData.emergency_contact_name}</p>
                  </div>
                  {patientData.emergency_contact_phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{patientData.emergency_contact_phone}</p>
                    </div>
                  )}
                  {patientData.emergency_contact_relationship && (
                    <div>
                      <p className="text-sm text-muted-foreground">Relationship</p>
                      <p className="font-medium">{patientData.emergency_contact_relationship}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No emergency contact on file</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No health records available</h3>
            <p className="text-sm text-muted-foreground">
              Your health records will appear here once your patient profile is set up.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
