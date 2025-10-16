"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import type { Visit } from "@/lib/types/database"

interface ActivityChartProps {
  visits: (Visit & {
    clinician?: {
      first_name: string
      last_name: string
    }
  })[]
}

export function ActivityChart({ visits }: ActivityChartProps) {
  // Group visits by day for the chart
  const visitsByDay = visits.reduce(
    (acc, visit) => {
      const date = new Date(visit.scheduled_start).toLocaleDateString("en-US", { weekday: "short" })
      acc[date] = (acc[date] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const maxVisits = Math.max(...Object.values(visitsByDay), 1)

  return (
    <Card className="border-border/50 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Activity Overview
          </CardTitle>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            This Week
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Simple bar chart visualization */}
        <div className="flex items-end justify-between gap-2 h-48">
          {days.map((day) => {
            const count = visitsByDay[day] || 0
            const height = maxVisits > 0 ? (count / maxVisits) * 100 : 0
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-40">
                  <div
                    className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-lg transition-all duration-500 hover:from-primary/80 hover:to-primary/40 relative group"
                    style={{ height: `${height}%`, minHeight: count > 0 ? "8px" : "0" }}
                  >
                    {count > 0 && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {count}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{day}</span>
              </div>
            )
          })}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-primary">{visits.length}</p>
            <p className="text-xs text-muted-foreground">Total Visits</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-chart-4">{visits.filter((v) => v.status === "completed").length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-accent">{visits.filter((v) => v.status === "scheduled").length}</p>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
