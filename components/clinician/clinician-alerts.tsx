"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Bell, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Alert {
  id: string
  patient_id: string
  alert_type: string
  severity: string
  title: string
  description?: string
  created_at: string
  patient?: {
    profile: {
      first_name: string
      last_name: string
    }
  }
}

interface ClinicianAlertsProps {
  alerts: Alert[]
}

export function ClinicianAlerts({ alerts: initialAlerts }: ClinicianAlertsProps) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const { toast } = useToast()
  const supabase = createClient()

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
      low: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    }
    return colors[severity] || "bg-gray-100 text-gray-800"
  }

  const getSeverityIcon = (severity: string) => {
    if (severity === "critical" || severity === "high") {
      return <AlertTriangle className="h-4 w-4" />
    }
    return <Bell className="h-4 w-4" />
  }

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fall_risk: "Fall Risk",
      medication_change: "Medication Change",
      hospitalization: "Hospitalization",
      emergency_contact_change: "Emergency Contact Change",
      care_plan_update: "Care Plan Update",
      family_concern: "Family Concern",
      non_compliance: "Non-Compliance",
      equipment_need: "Equipment Need",
      other: "Other",
    }
    return labels[type] || type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from("patient_alerts")
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq("id", alertId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      })
    } else {
      setAlerts(alerts.filter((a) => a.id !== alertId))
      toast({
        title: "Alert Resolved",
        description: "The alert has been marked as resolved",
      })
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Active Alerts
            </CardTitle>
            <CardDescription className="mt-1">
              {alerts.length} alert{alerts.length !== 1 ? "s" : ""} requiring attention
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/clinician/alerts">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 w-12 h-12 flex items-center justify-center mx-auto">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">No active alerts</p>
            <p className="text-xs text-muted-foreground">All patients are stable</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="border rounded-lg p-3 hover:shadow-sm transition-all duration-200 hover:border-primary/30 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getSeverityColor(alert.severity)} variant="outline">
                        {getSeverityIcon(alert.severity)}
                        <span className="ml-1">{alert.severity.toUpperCase()}</span>
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(alert.created_at)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{alert.title}</p>
                      {alert.patient && (
                        <p className="text-xs text-muted-foreground">
                          {alert.patient.profile.first_name} {alert.patient.profile.last_name}
                        </p>
                      )}
                    </div>
                    {alert.description && <p className="text-xs text-muted-foreground">{alert.description}</p>}
                    <p className="text-xs text-muted-foreground">{getAlertTypeLabel(alert.alert_type)}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-transparent hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                    asChild
                  >
                    <Link href={`/dashboard/patients/${alert.patient_id}`}>View Patient</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
