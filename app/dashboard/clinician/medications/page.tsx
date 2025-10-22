import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pill, Clock, AlertCircle, Search, User, Plus } from "lucide-react"
import Link from "next/link"

export default async function ClinicianMedicationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "clinician") {
    redirect("/dashboard")
  }

  // Get clinician ID
  const { data: clinician } = await supabase.from("clinicians").select("id").eq("profile_id", user.id).single()

  if (!clinician) {
    redirect("/dashboard")
  }

  // Get all patients assigned to this clinician
  const { data: patientRelationships } = await supabase
    .from("patient_clinicians")
    .select("patient_id")
    .eq("clinician_id", clinician.id)
    .is("revoked_at", null)

  const patientIds = patientRelationships?.map((r) => r.patient_id) || []

  // Fetch medications for all assigned patients
  const { data: medications } =
    patientIds.length > 0
      ? await supabase
          .from("medications")
          .select(
            `
      *,
      patient:patients!medications_patient_id_fkey(
        id,
        profile:profiles!patients_profile_id_fkey(first_name, last_name)
      )
    `,
          )
          .in("patient_id", patientIds)
          .eq("is_active", true)
          .order("name")
      : { data: [] }

  // Group medications by patient
  const medicationsByPatient = medications?.reduce(
    (acc: any, med: any) => {
      const patientId = med.patient.id
      if (!acc[patientId]) {
        acc[patientId] = {
          patient: med.patient,
          medications: [],
        }
      }
      acc[patientId].medications.push(med)
      return acc
    },
    {} as Record<string, any>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Patient Medications</h1>
          <p className="text-muted-foreground mt-1">View and manage medications for your patients</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Prescribe Medication
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search patients or medications..." className="pl-10" />
      </div>

      {!medicationsByPatient || Object.keys(medicationsByPatient).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No medications found</h3>
            <p className="text-sm text-muted-foreground mb-4">Your patients don't have any active medications yet.</p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Prescribe First Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(medicationsByPatient).map((patientData: any) => (
            <Card key={patientData.patient.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        <Link
                          href={`/dashboard/patients/${patientData.patient.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {patientData.patient.profile.first_name} {patientData.patient.profile.last_name}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {patientData.medications.length} active medication
                        {patientData.medications.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Plus className="h-3 w-3" />
                    Add Medication
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {patientData.medications.map((med: any) => (
                    <Card key={med.id} className="border-muted">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{med.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {med.dosage} • {med.frequency}
                            </CardDescription>
                          </div>
                          {med.reminder_enabled && (
                            <Badge variant="secondary" className="gap-1 ml-2">
                              <AlertCircle className="h-3 w-3" />
                              Reminders
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        {med.instructions && <p className="text-sm text-muted-foreground">{med.instructions}</p>}
                        {med.prescribing_physician && (
                          <p className="text-sm">
                            <span className="font-medium">Prescribed by:</span> {med.prescribing_physician}
                          </p>
                        )}
                        {med.reminder_times && med.reminder_times.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {med.reminder_times.map((time: string, index: number) => (
                              <Badge key={index} variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {time}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            Started {new Date(med.start_date).toLocaleDateString()}
                          </span>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
