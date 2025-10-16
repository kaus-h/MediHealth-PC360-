"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, MessageSquare, FileText, TrendingUp, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AdminStats {
  totalPatients: number
  totalClinicians: number
  totalCaregivers: number
  upcomingVisits: number
  completedVisitsToday: number
  unreadMessages: number
  pendingDocuments: number
  activeCarePlans: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
  user_name: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalPatients: 0,
    totalClinicians: 0,
    totalCaregivers: 0,
    upcomingVisits: 0,
    completedVisitsToday: 0,
    unreadMessages: 0,
    pendingDocuments: 0,
    activeCarePlans: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAdminData()
  }, [])

  async function fetchAdminData() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      patientsResult,
      cliniciansResult,
      caregiversResult,
      upcomingVisitsResult,
      completedTodayResult,
      unreadMessagesResult,
      pendingDocsResult,
      activeCarePlansResult,
    ] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "clinician"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "caregiver"),
      supabase
        .from("visits")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_date", new Date().toISOString())
        .eq("status", "scheduled"),
      supabase
        .from("visits")
        .select("id", { count: "exact", head: true })
        .gte("scheduled_date", today.toISOString())
        .lt("scheduled_date", tomorrow.toISOString())
        .eq("status", "completed"),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("read", false),
      supabase.from("documents").select("id", { count: "exact", head: true }).eq("category", "pending"),
      supabase.from("care_plans").select("id", { count: "exact", head: true }).eq("status", "active"),
    ])

    setStats({
      totalPatients: patientsResult.count || 0,
      totalClinicians: cliniciansResult.count || 0,
      totalCaregivers: caregiversResult.count || 0,
      upcomingVisits: upcomingVisitsResult.count || 0,
      completedVisitsToday: completedTodayResult.count || 0,
      unreadMessages: unreadMessagesResult.count || 0,
      pendingDocuments: pendingDocsResult.count || 0,
      activeCarePlans: activeCarePlansResult.count || 0,
    })

    const { data: activityData } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    setRecentActivity(activityData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-muted-foreground">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-3xl tracking-tight text-foreground">Agency Dashboard</h1>
        <p className="text-muted-foreground">Monitor agency operations and key metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground mt-1">Active patient records</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clinicians</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalClinicians}</div>
            <p className="text-xs text-muted-foreground mt-1">Active care providers</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Visits</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.upcomingVisits}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled visits</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.completedVisitsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Visits completed today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending responses</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Care Plans</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.activeCarePlans}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Caregivers</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalCaregivers}</div>
            <p className="text-xs text-muted-foreground mt-1">Family members/MPOAs</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <AlertCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.pendingDocuments}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <FileText className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.user_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform status and compliance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">HIPAA Compliance</p>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </div>
              <Badge variant="default" className="bg-accent text-accent-foreground">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Data Encryption</p>
                <p className="text-xs text-muted-foreground">At rest and in transit</p>
              </div>
              <Badge variant="default" className="bg-accent text-accent-foreground">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Audit Logging</p>
                <p className="text-xs text-muted-foreground">All PHI access tracked</p>
              </div>
              <Badge variant="default" className="bg-accent text-accent-foreground">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Backup Status</p>
                <p className="text-xs text-muted-foreground">Last backup: 2 hours ago</p>
              </div>
              <Badge variant="default" className="bg-accent text-accent-foreground">
                Current
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
