import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Pill,
  Star,
  Heart,
  FileText,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

export default async function PreVisitSummaryPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get pre-visit summary
  const { data: summaryData, error } = await supabase.rpc("get_pre_visit_summary", {
    p_visit_id: params.id,
  })

  if (error || !summaryData) {
    redirect("/dashboard/visits")
  }

  const summary = summaryData as any

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400",
      high: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
      low: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
    }
    return colors[severity] || colors.medium
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/visits">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Pre-Visit Summary</h1>
          <p className="text-muted-foreground mt-1">
            {formatDate(summary.visit.scheduled_start)} at {formatTime(summary.visit.scheduled_start)}
          </p>
        </div>
      </div>

      {/* Active Alerts */}
      {summary.active_alerts && summary.active_alerts.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({summary.active_alerts.length})
            </CardTitle>
            <CardDescription>Important information to review before the visit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.active_alerts.map((alert: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                <div className="flex-1">
                  <p className="font-medium">{alert.title}</p>
                  {alert.description && <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-2xl font-bold">{summary.patient.name}</p>
              <p className="text-sm text-muted-foreground">
                DOB: {new Date(summary.patient.date_of_birth).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{summary.patient.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{summary.patient.phone}</span>
              </div>
            </div>
            {summary.patient.emergency_contact && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-2">Emergency Contact</p>
                <p className="text-sm">{summary.patient.emergency_contact}</p>
                <p className="text-sm text-muted-foreground">{summary.patient.emergency_phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visit Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Visit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Visit Type</p>
              <p className="font-medium capitalize">{summary.visit.type.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled Time</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {formatTime(summary.visit.scheduled_start)} - {formatTime(summary.visit.scheduled_end)}
                </span>
              </div>
            </div>
            {summary.visit.visit_notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Visit Notes</p>
                <p className="text-sm">{summary.visit.visit_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Medications */}
      {summary.active_medications && summary.active_medications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Active Medications ({summary.active_medications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {summary.active_medications.map((med: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <p className="font-medium">{med.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {med.dosage} • {med.frequency}
                  </p>
                  {med.instructions && <p className="text-xs text-muted-foreground mt-1">{med.instructions}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Caregivers */}
      {summary.caregivers && summary.caregivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Caregivers & Family
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {summary.caregivers.map((caregiver: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{caregiver.name}</p>
                      {caregiver.is_mpoa && (
                        <Badge variant="secondary" className="text-xs">
                          MPOA
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">{caregiver.relationship}</p>
                    {caregiver.phone && (
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{caregiver.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Visit History */}
      {summary.recent_visits && summary.recent_visits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Visit History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recent_visits.map((visit: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium capitalize">{visit.type.replace(/_/g, " ")}</p>
                      <Badge variant="outline" className="text-xs">
                        {visit.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(visit.date).toLocaleDateString()}</p>
                    {visit.notes && <p className="text-sm mt-1">{visit.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Ratings */}
      {summary.recent_ratings && summary.recent_ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Recent Patient Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recent_ratings.map((rating: any, index: number) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < rating.overall_rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.feedback && <p className="text-sm">{rating.feedback}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/dashboard/visits">
          <Button variant="outline">Back to Visits</Button>
        </Link>
        <Button>Start Visit</Button>
      </div>
    </div>
  )
}
