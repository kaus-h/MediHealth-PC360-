import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Star, AlertTriangle, TrendingUp, Activity, Package, CheckCircle } from "lucide-react"

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "agency_admin") {
    redirect("/dashboard")
  }

  // Get agency metrics
  const { data: metricsData } = await supabase.from("agency_metrics").select("metrics").single()
  const metrics = metricsData?.metrics as any

  // Get quality metrics
  const { data: qualityMetrics } = await supabase.rpc("get_quality_metrics")
  const quality = qualityMetrics as any

  // Get operational metrics
  const { data: operationalMetrics } = await supabase.rpc("get_operational_metrics")
  const operational = operationalMetrics as any

  // Get top clinicians
  const { data: topClinicians } = await supabase
    .from("clinician_productivity")
    .select("*")
    .order("completed_visits", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Comprehensive insights and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_patients || 0}</div>
            <p className="text-xs text-muted-foreground">{metrics?.active_patients || 0} active in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clinicians</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.active_clinicians || 0}</div>
            <p className="text-xs text-muted-foreground">of {metrics?.total_clinicians || 0} total clinicians</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visits This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_visits_this_month || 0}</div>
            <p className="text-xs text-muted-foreground">{metrics?.completed_visits_this_month || 0} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avg_patient_satisfaction || 0}/5</div>
            <p className="text-xs text-muted-foreground">Last 30 days average</p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Patient Satisfaction Breakdown
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {quality?.patient_satisfaction && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall Rating</span>
                    <span className="font-medium">{quality.patient_satisfaction.avg_overall_rating}/5</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Care Quality</span>
                    <span className="font-medium">{quality.patient_satisfaction.avg_care_quality}/5</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Communication</span>
                    <span className="font-medium">{quality.patient_satisfaction.avg_communication}/5</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Professionalism</span>
                    <span className="font-medium">{quality.patient_satisfaction.avg_professionalism}/5</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Timeliness</span>
                    <span className="font-medium">{quality.patient_satisfaction.avg_timeliness}/5</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Would Recommend</span>
                    <Badge variant="secondary">{quality.patient_satisfaction.recommend_percentage}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {quality.patient_satisfaction.total_responses} responses
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Visit Completion Metrics
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {quality?.visit_completion && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Scheduled</span>
                    <span className="font-medium">{quality.visit_completion.total_scheduled}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium text-green-600">{quality.visit_completion.completed}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cancelled</span>
                    <span className="font-medium text-orange-600">{quality.visit_completion.cancelled}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">No Show</span>
                    <span className="font-medium text-red-600">{quality.visit_completion.no_show}</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <Badge variant="secondary">{quality.visit_completion.completion_rate}%</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts & Medication Adherence */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Patient Alerts
            </CardTitle>
            <CardDescription>Unresolved alerts by severity</CardDescription>
          </CardHeader>
          <CardContent>
            {quality?.active_alerts && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                  <span className="text-sm font-medium">Critical</span>
                  <Badge variant="destructive">{quality.active_alerts.critical}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                  <span className="text-sm font-medium">High</span>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    {quality.active_alerts.high}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
                  <span className="text-sm font-medium">Medium</span>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    {quality.active_alerts.medium}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium">Low</span>
                  <Badge variant="outline">{quality.active_alerts.low}</Badge>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Active Alerts</span>
                    <span className="text-2xl font-bold">{quality.active_alerts.total}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Medication Adherence
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {quality?.medication_adherence && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Reminders</span>
                    <span className="font-medium">{quality.medication_adherence.total_reminders}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Taken</span>
                    <span className="font-medium text-green-600">{quality.medication_adherence.taken}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Missed</span>
                    <span className="font-medium text-red-600">{quality.medication_adherence.missed}</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Adherence Rate</span>
                    <Badge variant="secondary">{quality.medication_adherence.adherence_rate}%</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Clinicians */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Clinicians
          </CardTitle>
          <CardDescription>Based on completed visits in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {topClinicians && topClinicians.length > 0 ? (
            <div className="space-y-3">
              {topClinicians.map((clinician: any, index: number) => (
                <div
                  key={clinician.clinician_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{clinician.clinician_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {clinician.completed_visits} completed • {clinician.unique_patients} patients
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{clinician.completion_rate}%</p>
                      <p className="text-xs text-muted-foreground">Completion</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{clinician.avg_rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Patient Engagement */}
      {operational?.patient_engagement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Engagement Status
            </CardTitle>
            <CardDescription>Current patient activity levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-3xl font-bold text-green-600">{operational.patient_engagement.active}</p>
                <p className="text-xs text-muted-foreground mt-1">Visit in last 30 days</p>
              </div>
              <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
                <p className="text-sm text-muted-foreground mb-1">At Risk</p>
                <p className="text-3xl font-bold text-yellow-600">{operational.patient_engagement.at_risk}</p>
                <p className="text-xs text-muted-foreground mt-1">30-90 days since visit</p>
              </div>
              <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20">
                <p className="text-sm text-muted-foreground mb-1">Inactive</p>
                <p className="text-3xl font-bold text-red-600">{operational.patient_engagement.inactive}</p>
                <p className="text-xs text-muted-foreground mt-1">90+ days since visit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
