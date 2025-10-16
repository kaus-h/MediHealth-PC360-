import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddMedicationDialog } from "@/components/medications/add-medication-dialog"
import { Pill, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default async function MedicationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()

  if (!patient) redirect("/dashboard")

  // Get active medications
  const { data: medications } = await supabase
    .from("medications")
    .select("*")
    .eq("patient_id", patient.id)
    .eq("is_active", true)
    .order("name")

  // Get today's medication logs
  const today = new Date().toISOString().split("T")[0]
  const { data: todayLogs } = await supabase
    .from("medication_logs")
    .select("*, medication:medications(*)")
    .eq("patient_id", patient.id)
    .gte("scheduled_time", `${today}T00:00:00`)
    .lte("scheduled_time", `${today}T23:59:59`)
    .order("scheduled_time")

  // Calculate adherence rate (last 30 days)
  const { data: adherenceData } = await supabase.rpc("calculate_medication_adherence", {
    p_patient_id: patient.id,
    p_days: 30,
  })

  const adherenceRate = adherenceData || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Medications</h1>
          <p className="text-muted-foreground mt-1">Track your medications and stay on schedule</p>
        </div>
        <AddMedicationDialog />
      </div>

      {/* Adherence Overview */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Adherence Rate</CardTitle>
          <CardDescription>Your medication adherence over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{adherenceRate}%</span>
              <Badge variant={adherenceRate >= 80 ? "default" : "destructive"}>
                {adherenceRate >= 80 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
            <Progress value={adherenceRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Today's Schedule</h2>
        {todayLogs && todayLogs.length > 0 ? (
          <div className="grid gap-3">
            {todayLogs.map((log: any) => (
              <Card key={log.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        log.status === "taken"
                          ? "bg-green-100 dark:bg-green-900/20"
                          : log.status === "missed"
                            ? "bg-red-100 dark:bg-red-900/20"
                            : "bg-blue-100 dark:bg-blue-900/20"
                      }`}
                    >
                      <Pill
                        className={`h-5 w-5 ${
                          log.status === "taken"
                            ? "text-green-600 dark:text-green-400"
                            : log.status === "missed"
                              ? "text-red-600 dark:text-red-400"
                              : "text-blue-600 dark:text-blue-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{log.medication.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.medication.dosage} •{" "}
                        {new Date(log.scheduled_time).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.status === "taken" ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Taken
                      </Badge>
                    ) : log.status === "missed" ? (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Missed
                      </Badge>
                    ) : (
                      <Button size="sm">Mark as Taken</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No medications scheduled for today</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Medications */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Medications</h2>
        {medications && medications.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {medications.map((med: any) => (
              <Card key={med.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{med.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {med.dosage} • {med.frequency}
                      </CardDescription>
                    </div>
                    {med.reminder_enabled && (
                      <Badge variant="secondary" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Reminders On
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
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
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Pill className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">No medications added yet</p>
              <AddMedicationDialog />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
