"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, AlertTriangle, Phone, FileText, MessageSquare } from "lucide-react"
import Link from "next/link"

interface Patient {
  id: string
  primary_diagnosis?: string
  profile: {
    first_name: string
    last_name: string
    phone?: string
  }
}

interface Alert {
  id: string
  patient_id: string
  alert_type: string
  severity: string
  title: string
}

interface PatientSnapshotsProps {
  patients: Patient[]
  alerts: Alert[]
}

export function PatientSnapshots({ patients, alerts }: PatientSnapshotsProps) {
  const getPatientAlerts = (patientId: string) => {
    return alerts.filter((a) => a.patient_id === patientId)
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
      low: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    }
    return colors[severity] || "bg-gray-100 text-gray-800"
  }

  if (patients.length === 0) {
    return null
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Patient Snapshots
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => {
            const patientAlerts = getPatientAlerts(patient.id)
            const highPriorityAlerts = patientAlerts.filter((a) => a.severity === "critical" || a.severity === "high")

            return (
              <div
                key={patient.id}
                className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-primary/30 space-y-4"
              >
                {/* Patient Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {patient.profile.first_name} {patient.profile.last_name}
                      </h3>
                      {patient.primary_diagnosis && (
                        <p className="text-xs text-muted-foreground">{patient.primary_diagnosis}</p>
                      )}
                    </div>
                  </div>
                  {highPriorityAlerts.length > 0 && (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {highPriorityAlerts.length}
                    </Badge>
                  )}
                </div>

                {/* Alerts */}
                {patientAlerts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Active Alerts:</p>
                    <div className="space-y-1">
                      {patientAlerts.slice(0, 2).map((alert) => (
                        <div key={alert.id} className="flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground line-clamp-1">{alert.title}</p>
                        </div>
                      ))}
                      {patientAlerts.length > 2 && (
                        <p className="text-xs text-muted-foreground">+{patientAlerts.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-transparent hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                  >
                    <Link href={`/dashboard/patients/${patient.id}`}>
                      <FileText className="h-3 w-3 mr-1" />
                      Details
                    </Link>
                  </Button>
                  {patient.profile.phone && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="bg-transparent hover:bg-accent/5 hover:text-accent hover:border-accent/30"
                    >
                      <a href={`tel:${patient.profile.phone}`}>
                        <Phone className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="bg-transparent hover:bg-chart-3/5 hover:text-chart-3 hover:border-chart-3/30"
                  >
                    <Link href={`/dashboard/messages?patient=${patient.id}`}>
                      <MessageSquare className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
