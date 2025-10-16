import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, User, FileText } from "lucide-react"
import { RateVisitDialog } from "@/components/visits/rate-visit-dialog"

export default async function VisitsPage() {
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

  // Determine patient IDs based on role
  let relevantPatientIds: string[] = []

  if (profile.role === "patient") {
    const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).maybeSingle()
    if (patient) relevantPatientIds = [patient.id]
  } else if (profile.role === "caregiver") {
    const { data: caregiver } = await supabase.from("caregivers").select("id").eq("profile_id", user.id).maybeSingle()
    if (caregiver) {
      const { data: patientCaregivers } = await supabase
        .from("patient_caregivers")
        .select("patient_id")
        .eq("caregiver_id", caregiver.id)
        .is("revoked_at", null)
      relevantPatientIds = patientCaregivers?.map((pc) => pc.patient_id) || []
    }
  } else if (profile.role === "clinician") {
    const { data: clinician } = await supabase.from("clinicians").select("id").eq("profile_id", user.id).maybeSingle()
    if (clinician) {
      // For clinicians, fetch visits where they are assigned
      const { data: allVisits } = await supabase
        .from("visits")
        .select(
          `
          *,
          patient:patients!visits_patient_id_fkey(
            id,
            profile:profiles!patients_profile_id_fkey(first_name, last_name)
          ),
          clinician:clinicians!visits_clinician_id_fkey(
            profile:profiles!clinicians_profile_id_fkey(first_name, last_name)
          )
        `,
        )
        .eq("clinician_id", clinician.id)
        .order("scheduled_start", { ascending: true })

      return renderVisitsPage(profile, allVisits || [], true)
    }
  }

  // Fetch visits for patients/caregivers
  const { data: visits } = await supabase
    .from("visits")
    .select(
      `
      *,
      patient:patients!visits_patient_id_fkey(
        id,
        profile:profiles!patients_profile_id_fkey(first_name, last_name)
      ),
      clinician:clinicians!visits_clinician_id_fkey(
        profile:profiles!clinicians_profile_id_fkey(first_name, last_name)
      )
    `,
    )
    .in("patient_id", relevantPatientIds)
    .order("scheduled_start", { ascending: true })

  return renderVisitsPage(profile, visits || [], false)
}

function renderVisitsPage(profile: any, visits: any[], isClinicianView: boolean) {
  const now = new Date()

  const upcomingVisits = visits.filter((v) => new Date(v.scheduled_start) >= now && v.status !== "completed")
  const pastVisits = visits.filter((v) => new Date(v.scheduled_start) < now || v.status === "completed")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getVisitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      nursing: "Nursing",
      physical_therapy: "Physical Therapy",
      occupational_therapy: "Occupational Therapy",
      speech_therapy: "Speech Therapy",
      aide: "Home Health Aide",
      other: "Other",
    }
    return labels[type] || type
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800 border-blue-200",
      en_route: "bg-green-100 text-green-800 border-green-200",
      in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
      completed: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      no_show: "bg-orange-100 text-orange-800 border-orange-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const VisitCard = ({ visit }: { visit: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{getVisitTypeLabel(visit.visit_type)}</h3>
              <Badge className={getStatusColor(visit.status)}>{getStatusLabel(visit.status)}</Badge>
            </div>
            {visit.status === "scheduled" && (
              <Button variant="outline" size="sm">
                Reschedule
              </Button>
            )}
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(visit.scheduled_start)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {formatTime(visit.scheduled_start)} - {formatTime(visit.scheduled_end)}
              </span>
            </div>
            {visit.clinician?.profile && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {visit.clinician.profile.first_name} {visit.clinician.profile.last_name}
                </span>
              </div>
            )}
            {isClinicianView && visit.patient?.profile && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  Patient: {visit.patient.profile.first_name} {visit.patient.profile.last_name}
                </span>
              </div>
            )}
          </div>

          {visit.visit_notes && (
            <div className="pt-3 border-t">
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-muted-foreground">{visit.visit_notes}</p>
              </div>
            </div>
          )}

          {visit.status === "completed" && (
            <div className="pt-3 border-t flex items-center gap-2">
              <Button variant="link" size="sm" className="p-0 h-auto">
                View Visit Summary
              </Button>
              <span className="text-muted-foreground">•</span>
              <RateVisitDialog
                visitId={visit.id}
                clinicianName={`${visit.clinician?.profile?.first_name || ""} ${visit.clinician?.profile?.last_name || ""}`}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visits</h1>
          <p className="text-muted-foreground mt-1">
            {isClinicianView ? "Manage your scheduled visits" : "View and manage your care visits"}
          </p>
        </div>
        {isClinicianView && (
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingVisits.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastVisits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingVisits.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming visits</h3>
                <p className="text-sm text-muted-foreground">
                  {isClinicianView
                    ? "You don't have any visits scheduled at the moment."
                    : "You don't have any upcoming visits scheduled."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingVisits.map((visit) => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastVisits.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No past visits</h3>
                <p className="text-sm text-muted-foreground">Your visit history will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pastVisits.map((visit) => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
