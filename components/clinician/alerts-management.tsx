"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Activity,
  Pill,
  Droplet,
  Heart,
  Thermometer,
  Wind,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Alert {
  id: string
  patient_id: string
  alert_type: string
  severity: string
  message: string
  is_resolved: boolean
  resolved_at?: string
  resolved_by?: string
  created_at: string
  patient?: {
    id: string
    profile: {
      first_name: string
      last_name: string
    }
  }
}

interface AlertsManagementProps {
  alerts: Alert[]
  clinicianId: string
}

export function AlertsManagement({ alerts: initialAlerts, clinicianId }: AlertsManagementProps) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const getAlertIcon = (type: string) => {
    const icons: Record<string, any> = {
      vital_signs: Activity,
      medication: Pill,
      lab_results: Droplet,
      heart_rate: Heart,
      blood_pressure: TrendingUp,
      temperature: Thermometer,
      oxygen_saturation: Wind,
      general: AlertTriangle,
    }
    const Icon = icons[type] || AlertTriangle
    return <Icon className="h-5 w-5" />
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-blue-100 text-blue-800 border-blue-200",
    }
    return colors[severity] || "bg-gray-100 text-gray-800"
  }

  const getSeverityBadgeColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "destructive",
      high: "destructive",
      medium: "default",
      low: "secondary",
    }
    return colors[severity] || "secondary"
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
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    setResolvingId(alertId)

    const { error } = await supabase
      .from("alerts")
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: clinicianId,
      })
      .eq("id", alertId)

    setResolvingId(null)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      })
    } else {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                is_resolved: true,
                resolved_at: new Date().toISOString(),
                resolved_by: clinicianId,
              }
            : alert,
        ),
      )
      toast({
        title: "Alert Resolved",
        description: "The alert has been marked as resolved",
      })
    }
  }

  const filteredAndSortedAlerts = useMemo(() => {
    const filtered = alerts.filter((alert) => {
      const matchesSearch =
        !searchTerm ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${alert.patient?.profile.first_name} ${alert.patient?.profile.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter
      const matchesType = typeFilter === "all" || alert.alert_type === typeFilter

      return matchesSearch && matchesSeverity && matchesType
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "severity":
          const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
          return severityOrder[a.severity] - severityOrder[b.severity]
        case "patient":
          const nameA = `${a.patient?.profile.first_name} ${a.patient?.profile.last_name}`
          const nameB = `${b.patient?.profile.first_name} ${b.patient?.profile.last_name}`
          return nameA.localeCompare(nameB)
        default:
          return 0
      }
    })

    return filtered
  }, [alerts, searchTerm, severityFilter, typeFilter, sortBy])

  const activeAlerts = filteredAndSortedAlerts.filter((a) => !a.is_resolved)
  const resolvedAlerts = filteredAndSortedAlerts.filter((a) => a.is_resolved)

  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length
  const highCount = activeAlerts.filter((a) => a.severity === "high").length

  const alertTypes = [...new Set(alerts.map((a) => a.alert_type))]

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Alerts Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage patient alerts</p>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-base px-3 py-1">
              {criticalCount} Critical
            </Badge>
          )}
          {highCount > 0 && (
            <Badge variant="destructive" className="text-base px-3 py-1">
              {highCount} High
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{activeAlerts.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold">{criticalCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{highCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {
                  resolvedAlerts.filter((a) => {
                    const resolvedDate = new Date(a.resolved_at!)
                    const today = new Date()
                    return resolvedDate.toDateString() === today.toDateString()
                  }).length
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {alertTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="severity">By Severity</SelectItem>
                <SelectItem value="patient">By Patient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="relative">
            Active Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedAlerts.length})</TabsTrigger>
        </TabsList>

        {/* Active Alerts */}
        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-lg font-semibold">No Active Alerts</p>
                  <p className="text-muted-foreground">All alerts have been resolved</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`border-l-4 ${
                    alert.severity === "critical"
                      ? "border-l-red-500"
                      : alert.severity === "high"
                        ? "border-l-orange-500"
                        : alert.severity === "medium"
                          ? "border-l-yellow-500"
                          : "border-l-blue-500"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`p-2 rounded-lg ${
                            alert.severity === "critical"
                              ? "bg-red-100 text-red-600"
                              : alert.severity === "high"
                                ? "bg-orange-100 text-orange-600"
                                : alert.severity === "medium"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {getAlertIcon(alert.alert_type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">
                              {alert.patient?.profile.first_name} {alert.patient?.profile.last_name}
                            </p>
                            <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="secondary">
                              {alert.alert_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                          </div>
                          <p className="text-sm">{alert.message}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(alert.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                        disabled={resolvingId === alert.id}
                      >
                        {resolvingId === alert.id ? "Resolving..." : "Resolve"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Resolved Alerts */}
        <TabsContent value="resolved" className="space-y-4">
          {resolvedAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold">No Resolved Alerts</p>
                  <p className="text-muted-foreground">Resolved alerts will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {resolvedAlerts.map((alert) => (
                <Card key={alert.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">
                            {alert.patient?.profile.first_name} {alert.patient?.profile.last_name}
                          </p>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Resolved
                          </Badge>
                          <Badge variant="secondary">
                            {alert.alert_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Created {formatDate(alert.created_at)}</span>
                          </div>
                          {alert.resolved_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Resolved {formatDate(alert.resolved_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
