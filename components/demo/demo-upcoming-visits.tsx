"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface Visit {
  id: string
  visit_type: string
  scheduled_start: string
  scheduled_end: string
  status: string
  notes?: string
  clinician?: {
    first_name: string
    last_name: string
  }
}

interface DemoUpcomingVisitsProps {
  visits: Visit[]
}

export function DemoUpcomingVisits({ visits }: DemoUpcomingVisitsProps) {
  const router = useRouter()

  const handleViewAll = () => {
    router.push("/demo/visits")
  }

  const handleVisitClick = (visitId: string) => {
    router.push("/demo/visits")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Visits
        </CardTitle>
        <Button variant="ghost" size="sm" className="gap-1" onClick={handleViewAll}>
          View All
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No upcoming visits scheduled</p>
        ) : (
          visits.map((visit) => (
            <button
              key={visit.id}
              onClick={() => handleVisitClick(visit.id)}
              className="w-full text-left p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {visit.visit_type}
                    </h4>
                    <Badge variant="outline" className={getStatusColor(visit.status)}>
                      {visit.status}
                    </Badge>
                  </div>
                  {visit.clinician && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {visit.clinician.first_name} {visit.clinician.last_name}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(visit.scheduled_start).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {visit.notes && <p className="text-xs text-muted-foreground line-clamp-2">{visit.notes}</p>}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  )
}
