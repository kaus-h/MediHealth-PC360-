import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Visit } from "@/lib/types/database"

interface UpcomingVisitsProps {
  visits: (Visit & {
    clinician?: {
      first_name: string
      last_name: string
    }
  })[]
}

export function UpcomingVisits({ visits }: UpcomingVisitsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
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
      scheduled: "bg-primary/10 text-primary border-primary/20",
      en_route: "bg-accent/10 text-accent border-accent/20",
      in_progress: "bg-chart-4/10 text-chart-4 border-chart-4/20",
      completed: "bg-muted text-muted-foreground border-border",
      cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    }
    return colors[status] || "bg-muted text-muted-foreground"
  }

  return (
    <Card className="border-border/50 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Visits
        </CardTitle>
        <Button asChild variant="ghost" size="sm" className="gap-2 hover:text-primary group">
          <Link href="/dashboard/visits">
            View All
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No upcoming visits scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className="group relative flex items-start gap-4 rounded-xl border border-border/50 p-4 hover:bg-muted/30 hover:border-primary/30 transition-all duration-200"
              >
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex-1 space-y-3 pl-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground text-base">{getVisitTypeLabel(visit.visit_type)}</p>
                    <Badge className={getStatusColor(visit.status)} variant="outline">
                      {visit.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">{formatDate(visit.scheduled_start)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent" />
                      <span>
                        {formatTime(visit.scheduled_start)} - {formatTime(visit.scheduled_end)}
                      </span>
                    </div>
                  </div>

                  {visit.clinician && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="rounded-full bg-primary/10 p-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">
                        {visit.clinician.first_name} {visit.clinician.last_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
