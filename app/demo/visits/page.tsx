"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, User, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DemoVisitsPage() {
  const { toast } = useToast()

  const mockVisits = [
    {
      id: "1",
      visit_type: "nursing",
      status: "scheduled",
      scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      clinician: {
        profile: {
          first_name: "Sarah",
          last_name: "Johnson",
        },
      },
      visit_notes: "Regular check-up and medication review",
    },
    {
      id: "2",
      visit_type: "physical_therapy",
      status: "scheduled",
      scheduled_start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
      clinician: {
        profile: {
          first_name: "Michael",
          last_name: "Chen",
        },
      },
      visit_notes: "Mobility exercises and strength training",
    },
    {
      id: "3",
      visit_type: "nursing",
      status: "completed",
      scheduled_start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      scheduled_end: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      clinician: {
        profile: {
          first_name: "Sarah",
          last_name: "Johnson",
        },
      },
      visit_notes: "Vital signs checked, all within normal range",
    },
  ]

  const now = new Date()
  const upcomingVisits = mockVisits.filter((v) => new Date(v.scheduled_start) >= now && v.status !== "completed")
  const pastVisits = mockVisits.filter((v) => new Date(v.scheduled_start) < now || v.status === "completed")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
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
      scheduled: "bg-blue-100 text-blue-800 border-blue-200",
      en_route: "bg-green-100 text-green-800 border-green-200",
      in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
      completed: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      no_show: "bg-orange-100 text-orange-800 border-orange-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const handleDemoAction = () => {
    toast({
      title: "Demo Mode",
      description:
        "This feature is available for authenticated users. Please sign up or log in to access full functionality.",
      variant: "default",
    })
  }

  const VisitCard = ({ visit }: { visit: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{getVisitTypeLabel(visit.visit_type)}</h3>
              <Badge className={getStatusColor(visit.status)}>{getStatusLabel(visit.status)}</Badge>
            </div>
            {visit.status === "scheduled" && (
              <Button variant="outline" size="sm" onClick={handleDemoAction}>
                Reschedule
              </Button>
            )}
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(visit.scheduled_start)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {formatTime(visit.scheduled_start)} - {formatTime(visit.scheduled_end)}
              </span>
            </div>
            {visit.clinician?.profile && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {visit.clinician.profile.first_name} {visit.clinician.profile.last_name}
                </span>
              </div>
            )}
          </div>

          {visit.visit_notes && (
            <div className="pt-3 border-t">
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-muted-foreground">{visit.visit_notes}</p>
              </div>
            </div>
          )}

          {visit.status === "completed" && (
            <div className="pt-3 border-t">
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleDemoAction}>
                View Visit Summary
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visits</h1>
          <p className="text-muted-foreground mt-1">View and manage your care visits</p>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingVisits.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastVisits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingVisits.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {pastVisits.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
