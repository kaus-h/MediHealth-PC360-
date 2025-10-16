import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StatCard } from "@/components/dashboard/stat-card"
import { UpcomingVisits } from "@/components/dashboard/upcoming-visits"
import { RecentMessages } from "@/components/dashboard/recent-messages"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import { HealthMetrics } from "@/components/dashboard/health-metrics"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Calendar, MessageSquare, FileText, Activity, Users, Bell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!profile) {
    redirect("/auth/login")
  }

  // Fetch patient data if user is a patient
  let patientId: string | null = null
  if (profile.role === "patient") {
    const { data: patient } = await supabase
      .from("accessible_patients")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle()
    patientId = patient?.id || null
  }

  // Fetch caregiver's patients if user is a caregiver
  let caregiverPatientIds: string[] = []
  if (profile.role === "caregiver") {
    const { data: caregiver } = await supabase.from("caregivers").select("id").eq("profile_id", user.id).maybeSingle()

    if (caregiver) {
      const { data: patientCaregivers } = await supabase
        .from("patient_caregivers")
        .select("patient_id")
        .eq("caregiver_id", caregiver.id)
        .is("revoked_at", null)

      caregiverPatientIds = patientCaregivers?.map((pc) => pc.patient_id) || []
    }
  }

  // Determine which patient IDs to query
  const relevantPatientIds = profile.role === "patient" && patientId ? [patientId] : caregiverPatientIds

  const { count: pendingInvitationsCount } = await supabase
    .from("invitations")
    .select("*", { count: "exact", head: true })
    .or(`invitee_id.eq.${user.id},invitee_email.eq.${profile.email}`)
    .eq("status", "pending")

  // Fetch upcoming visits
  const { data: visits } =
    relevantPatientIds.length > 0
      ? await supabase
          .from("visits")
          .select(
            `
          *,
          clinician:clinicians!visits_clinician_id_fkey(
            profile:profiles!clinicians_profile_id_fkey(first_name, last_name)
          )
        `,
          )
          .in("patient_id", relevantPatientIds)
          .gte("scheduled_start", new Date().toISOString())
          .order("scheduled_start", { ascending: true })
          .limit(5)
      : { data: null }

  // Transform visits data
  const transformedVisits =
    visits?.map((visit) => ({
      ...visit,
      clinician: visit.clinician?.profile
        ? {
            first_name: visit.clinician.profile.first_name,
            last_name: visit.clinician.profile.last_name,
          }
        : undefined,
    })) || []

  // Fetch recent messages
  const { data: messages } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:profiles!messages_sender_id_fkey(first_name, last_name, role)
    `,
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Transform messages data
  const transformedMessages =
    messages?.map((message) => ({
      ...message,
      sender: message.sender
        ? {
            first_name: message.sender.first_name,
            last_name: message.sender.last_name,
            role: message.sender.role,
          }
        : undefined,
    })) || []

  // Count unread messages
  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false)

  // Count upcoming visits
  const upcomingVisitsCount = visits?.length || 0

  // Count care plans (for patients/caregivers)
  let carePlansCount = 0
  if (relevantPatientIds.length > 0) {
    const { count } = await supabase
      .from("care_plans")
      .select("*", { count: "exact", head: true })
      .in("patient_id", relevantPatientIds)
      .eq("status", "active")
    carePlansCount = count || 0
  }

  // Count documents
  let documentsCount = 0
  if (relevantPatientIds.length > 0) {
    const { count } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .in("patient_id", relevantPatientIds)
    documentsCount = count || 0
  }

  // Count total patients (for caregivers)
  const totalPatients = caregiverPatientIds.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:to-primary/10">
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-balance text-foreground">
                Welcome back, {profile.first_name}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg font-medium">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Profile Avatar with Image */}
            <div className="hidden md:block">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {profile.first_name[0]}
                    {profile.last_name[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(pendingInvitationsCount ?? 0) > 0 && (
            <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/20 p-2 animate-pulse">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      You have {pendingInvitationsCount} pending invitation{pendingInvitationsCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profile.role === "patient"
                        ? "Clinicians have sent you care team invitations"
                        : "You have pending connection requests"}
                    </p>
                  </div>
                  <Button asChild size="sm" className="bg-primary hover:bg-primary/90 shadow-md">
                    <Link href="/dashboard/invitations">View Invitations</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Upcoming Visits"
            value={upcomingVisitsCount}
            icon={Calendar}
            description="Next 7 days"
            trend={{ value: 12, isPositive: true }}
            gradient="from-primary/20 via-primary/10 to-primary/5"
            href="/dashboard/visits"
          />
          <StatCard
            title="Unread Messages"
            value={unreadCount || 0}
            icon={MessageSquare}
            description="New communications"
            trend={{ value: 8, isPositive: false }}
            gradient="from-accent/20 via-accent/10 to-accent/5"
            href="/dashboard/messages"
          />
          <StatCard
            title="Active Care Plans"
            value={carePlansCount}
            icon={Activity}
            description="In progress"
            trend={{ value: 5, isPositive: true }}
            gradient="from-chart-3/20 via-chart-3/10 to-chart-3/5"
            href="/dashboard/care-plans"
          />
          <StatCard
            title={profile.role === "caregiver" ? "Total Patients" : "Documents"}
            value={profile.role === "caregiver" ? totalPatients : documentsCount}
            icon={profile.role === "caregiver" ? Users : FileText}
            description={profile.role === "caregiver" ? "Under your care" : "Available records"}
            gradient="from-chart-4/20 via-chart-4/10 to-chart-4/5"
            href={profile.role === "caregiver" ? "/dashboard/patients" : "/dashboard/documents"}
          />
        </div>

        <QuickActions role={profile.role} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityChart visits={transformedVisits} />
          </div>
          <div className="lg:col-span-1">
            <HealthMetrics patientIds={relevantPatientIds} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingVisits visits={transformedVisits} />
          <RecentMessages messages={transformedMessages} />
        </div>
      </div>
    </div>
  )
}
