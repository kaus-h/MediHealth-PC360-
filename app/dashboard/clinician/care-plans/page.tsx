import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Activity, Target, Calendar, Plus, User } from "lucide-react"
import Link from "next/link"

export default async function ClinicianCarePlansPage() {
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

  // Fetch care plans for all assigned patients
  const { data: carePlans } =
    patientIds.length > 0
      ? await supabase
          .from("care_plans")
          .select(
            `
      *,
      patient:patients!care_plans_patient_id_fkey(
        id,
        profile:profiles!patients_profile_id_fkey(first_name, last_name)
      ),
      goals:care_plan_goals(*)
    `,
          )
          .in("patient_id", patientIds)
          .order("created_at", { ascending: false })
      : { data: [] }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400",
      completed: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
      cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getGoalStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Patient Care Plans</h1>
          <p className="text-muted-foreground mt-1">Create and manage care plans for your patients</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Care Plan
        </Button>
      </div>

      {!carePlans || carePlans.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No care plans yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create care plans to help your patients achieve their health goals.
            </p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Care Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {carePlans.map((plan: any) => {
            const totalGoals = plan.goals?.length || 0
            const completedGoals = plan.goals?.filter((g: any) => g.status === "completed").length || 0
            const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

            return (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{plan.title}</CardTitle>
                        <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <Link
                          href={`/dashboard/patients/${plan.patient.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {plan.patient.profile.first_name} {plan.patient.profile.last_name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(plan.start_date)}
                            {plan.end_date && ` - ${formatDate(plan.end_date)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit Plan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}

                  {/* Overall Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Overall Progress</span>
                      <span className="text-muted-foreground">
                        {completedGoals} of {totalGoals} goals completed
                      </span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>

                  {/* Goals */}
                  {plan.goals && plan.goals.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Goals
                        </h4>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Plus className="h-3 w-3" />
                          Add Goal
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {plan.goals.map((goal: any) => (
                          <div
                            key={goal.id}
                            className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <p className="font-medium text-sm flex-1">{goal.goal_text}</p>
                              <Badge variant="secondary" className={getGoalStatusColor(goal.status)}>
                                {goal.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            {goal.target_date && (
                              <p className="text-xs text-muted-foreground">Target: {formatDate(goal.target_date)}</p>
                            )}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{goal.progress_percentage}%</span>
                              </div>
                              <Progress value={goal.progress_percentage} className="h-1.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
