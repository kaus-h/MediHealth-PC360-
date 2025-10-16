import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Target, Calendar } from "lucide-react"

export default async function CarePlansPage() {
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
    const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()
    if (patient) relevantPatientIds = [patient.id]
  } else if (profile.role === "caregiver") {
    const { data: caregiver } = await supabase.from("caregivers").select("id").eq("profile_id", user.id).single()
    if (caregiver) {
      const { data: patientCaregivers } = await supabase
        .from("patient_caregivers")
        .select("patient_id")
        .eq("caregiver_id", caregiver.id)
        .is("revoked_at", null)
      relevantPatientIds = patientCaregivers?.map((pc) => pc.patient_id) || []
    }
  }

  // Fetch care plans with goals
  const { data: carePlans } = await supabase
    .from("care_plans")
    .select(
      `
      *,
      goals:care_plan_goals(*)
    `,
    )
    .in("patient_id", relevantPatientIds)
    .order("created_at", { ascending: false })

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
      active: "bg-green-100 text-green-800 border-green-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getGoalStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Care Plans</h1>
        <p className="text-muted-foreground mt-1">Track your treatment goals and progress</p>
      </div>

      {!carePlans || carePlans.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No care plans yet</h3>
            <p className="text-sm text-muted-foreground">
              Your care plans will appear here once they are created by your care team.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {carePlans.map((plan) => {
            const totalGoals = plan.goals?.length || 0
            const completedGoals = plan.goals?.filter((g: any) => g.status === "completed").length || 0
            const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

            return (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{plan.title}</CardTitle>
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
                    <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
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
                      <h4 className="font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Goals
                      </h4>
                      <div className="space-y-3">
                        {plan.goals.map((goal: any) => (
                          <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
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
