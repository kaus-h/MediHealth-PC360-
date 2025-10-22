import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TodaySchedule } from "@/components/clinician/today-schedule"
import { PatientSnapshots } from "@/components/clinician/patient-snapshots"
import { ClinicianAlerts } from "@/components/clinician/clinician-alerts"
import { ClinicianQuickActions } from "@/components/clinician/clinician-quick-actions"
import { StatCard } from "@/components/dashboard/stat-card"
import { Calendar, Users, AlertTriangle, CheckCircle } from "lucide-react"

export default async function ClinicianDashboardPage() {
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

  // Fetch today's visits
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: todayVisits } = await supabase
    .from("visits")
    .select(
      `
      *,
      patient:patients!visits_patient_id_fkey(
        id,
        primary_diagnosis,
        profile:profiles!patients_profile_id_fkey(first_name, last_name, address, city, state)
      )
    `,
    )
    .eq("clinician_id", clinician.id)
    .gte("scheduled_start", today.toISOString())
    .lt("scheduled_start", tomorrow.toISOString())
    .order("scheduled_start", { ascending: true })

  // Fetch upcoming visits count
  const { count: upcomingVisitsCount } = await supabase
    .from("visits")
    .select("*", { count: "exact", head: true })
    .eq("clinician_id", clinician.id)
    .gte("scheduled_start", new Date().toISOString())
    .in("status", ["scheduled", "en_route"])

  // Fetch total patients count
  const { count: totalPatientsCount } = await supabase
    .from("patient_clinicians")
    .select("*", { count: "exact", head: true })
    .eq("clinician_id", clinician.id)
    .is("revoked_at", null)

  // Fetch unread messages count
  const { count: unreadMessagesCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false)

  // Fetch active alerts count
  const patientIds =
    (
      await supabase
        .from("patient_clinicians")
        .select("patient_id")
        .eq("clinician_id", clinician.id)
        .is("revoked_at", null)
    ).data?.map((pc) => pc.patient_id) || []

  const { count: activeAlertsCount } =
    patientIds.length > 0
      ? await supabase
          .from("patient_alerts")
          .select("*", { count: "exact", head: true })
          .in("patient_id", patientIds)
          .is("resolved_at", null)
          .in("severity", ["high", "critical"])
      : { count: 0 }

  // Fetch patient snapshots (patients with visits today or active alerts)
  const patientSnapshotIds = [...new Set(todayVisits?.map((v) => v.patient_id) || [])]

  const { data: patientSnapshots } =
    patientSnapshotIds.length > 0
      ? await supabase
          .from("accessible_patients")
          .select(
            `
          id,
          primary_diagnosis,
          profile:profiles!patients_profile_id_fkey(first_name, last_name, phone)
        `,
          )
          .in("id", patientSnapshotIds)
      : { data: [] }

  // Fetch alerts for snapshot patients
  const { data: patientAlerts } =
    patientSnapshotIds.length > 0
      ? await supabase
          .from("patient_alerts")
          .select("*")
          .in("patient_id", patientSnapshotIds)
          .is("resolved_at", null)
          .order("severity", { ascending: false })
          .order("created_at", { ascending: false })
      : { data: [] }

  // Fetch recent alerts for the clinician
  const { data: recentAlerts } =
    patientIds.length > 0
      ? await supabase
          .from("patient_alerts")
          .select(
            `
          *,
          patient:patients!patient_alerts_patient_id_fkey(
            profile:profiles!patients_profile_id_fkey(first_name, last_name)
          )
        `,
          )
          .in("patient_id", patientIds)
          .is("resolved_at", null)
          .order("severity", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(10)
      : { data: [] }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-foreground">
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"},{" "}
              {profile.first_name}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg font-medium mt-2">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Visits"
            value={todayVisits?.length || 0}
            icon={Calendar}
            description="Scheduled for today"
            gradient="from-primary/20 via-primary/10 to-primary/5"
            href="/dashboard/visits"
          />
          <StatCard
            title="Total Patients"
            value={totalPatientsCount || 0}
            icon={Users}
            description="Active caseload"
            gradient="from-accent/20 via-accent/10 to-accent/5"
            href="/dashboard/team"
          />
          <StatCard
            title="Active Alerts"
            value={activeAlertsCount || 0}
            icon={AlertTriangle}
            description="High priority"
            gradient="from-destructive/20 via-destructive/10 to-destructive/5"
            href="/dashboard/clinician/alerts"
          />
          <StatCard
            title="Upcoming Visits"
            value={upcomingVisitsCount || 0}
            icon={CheckCircle}
            description="Next 7 days"
            gradient="from-chart-3/20 via-chart-3/10 to-chart-3/5"
            href="/dashboard/visits"
          />
        </div>

        {/* Quick Actions */}
        <ClinicianQuickActions />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Schedule - Takes 2 columns */}
          <div className="lg:col-span-2">
            <TodaySchedule visits={todayVisits || []} clinicianId={clinician.id} />
          </div>

          {/* Alerts - Takes 1 column */}
          <div className="lg:col-span-1">
            <ClinicianAlerts alerts={recentAlerts || []} />
          </div>
        </div>

        {/* Patient Snapshots */}
        <PatientSnapshots patients={patientSnapshots || []} alerts={patientAlerts || []} />
      </div>
    </div>
  )
}
