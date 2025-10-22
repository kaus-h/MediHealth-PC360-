"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Navigation, FileText } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface Visit {
  id: string
  scheduled_start: string
  scheduled_end: string
  visit_type: string
  status: string
  visit_notes?: string
  patient: {
    id: string
    primary_diagnosis?: string
    profile: {
      first_name: string
      last_name: string
      address?: string
      city?: string
      state?: string
    }
  }
}

interface TodayScheduleProps {
  visits: Visit[]
  clinicianId: string
}

export function TodaySchedule({ visits, clinicianId }: TodayScheduleProps) {
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getVisitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      nursing: "Nursing Visit",
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
      scheduled: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
      en_route: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
      in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
      completed: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
      cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Calculate estimated drive time (placeholder - would integrate with routing API)
  const getEstimatedDriveTime = (address?: string) => {
    // This would integrate with Google Maps API or similar
    return "15 min"
  }

  const getDirectionsUrl = (address?: string, city?: string, state?: string) => {
    const fullAddress = [address, city, state].filter(Boolean).join(", ")
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Today's Schedule
            </CardTitle>
            <CardDescription className="mt-1">
              {visits.length} visit{visits.length !== 1 ? "s" : ""} scheduled
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/visits">
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No visits scheduled for today</p>
            <p className="text-xs text-muted-foreground">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-primary/30"
              >
                <div className="space-y-4">
                  {/* Visit Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">
                          {visit.patient.profile.first_name} {visit.patient.profile.last_name}
                        </h3>
                        <Badge className={getStatusColor(visit.status)} variant="outline">
                          {getStatusLabel(visit.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{getVisitTypeLabel(visit.visit_type)}</p>
                      {visit.patient.primary_diagnosis && (
                        <p className="text-sm text-muted-foreground">Dx: {visit.patient.primary_diagnosis}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>
                          {formatTime(visit.scheduled_start)} - {formatTime(visit.scheduled_end)}
                        </span>
                      </div>
                      {visit.patient.profile.address && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Navigation className="h-3 w-3" />
                          <span>~{getEstimatedDriveTime(visit.patient.profile.address)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visit Details */}
                  {visit.patient.profile.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-muted-foreground">
                          {visit.patient.profile.address}
                          {visit.patient.profile.city && `, ${visit.patient.profile.city}`}
                          {visit.patient.profile.state && `, ${visit.patient.profile.state}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {visit.patient.profile.address && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="bg-transparent hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                      >
                        <a
                          href={getDirectionsUrl(
                            visit.patient.profile.address,
                            visit.patient.profile.city,
                            visit.patient.profile.state,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Get Directions
                        </a>
                      </Button>
                    )}
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="bg-transparent hover:bg-accent/5 hover:text-accent hover:border-accent/30"
                    >
                      <Link href={`/dashboard/patients/${visit.patient.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Patient Details
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="bg-transparent hover:bg-chart-3/5 hover:text-chart-3 hover:border-chart-3/30"
                    >
                      <Link href={`/dashboard/visits/${visit.id}/pre-visit-summary`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Pre-Visit Summary
                      </Link>
                    </Button>
                  </div>

                  {/* Visit Notes */}
                  {visit.visit_notes && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Notes:</span> {visit.visit_notes}
                      </p>
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
