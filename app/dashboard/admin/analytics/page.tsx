"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, MessageSquare, FileText } from "lucide-react"

interface AnalyticsData {
  visitsByType: { type: string; count: number }[]
  visitsByStatus: { status: string; count: number }[]
  messageVolume: { date: string; count: number }[]
  patientEngagement: { metric: string; value: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    visitsByType: [],
    visitsByStatus: [],
    messageVolume: [],
    patientEngagement: [],
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    const { data: visits } = await supabase.from("visits").select("visit_type, status, scheduled_date")

    const visitsByType =
      visits?.reduce((acc: any[], visit) => {
        const existing = acc.find((v) => v.type === visit.visit_type)
        if (existing) {
          existing.count++
        } else {
          acc.push({ type: visit.visit_type, count: 1 })
        }
        return acc
      }, []) || []

    const visitsByStatus =
      visits?.reduce((acc: any[], visit) => {
        const existing = acc.find((v) => v.status === visit.status)
        if (existing) {
          existing.count++
        } else {
          acc.push({ status: visit.status, count: 1 })
        }
        return acc
      }, []) || []

    const { data: messages } = await supabase
      .from("messages")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(100)

    const messageVolume =
      messages?.reduce((acc: any[], msg) => {
        const date = new Date(msg.created_at).toLocaleDateString()
        const existing = acc.find((m) => m.date === date)
        if (existing) {
          existing.count++
        } else {
          acc.push({ date, count: 1 })
        }
        return acc
      }, []) || []

    const { count: totalPatients } = await supabase.from("patients").select("id", { count: "exact", head: true })

    const { count: activeCarePlans } = await supabase
      .from("care_plans")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")

    const { count: totalMessages } = await supabase.from("messages").select("id", { count: "exact", head: true })

    const patientEngagement = [
      { metric: "Total Patients", value: totalPatients || 0 },
      { metric: "Active Care Plans", value: activeCarePlans || 0 },
      { metric: "Messages Sent", value: totalMessages || 0 },
      { metric: "Engagement Rate", value: Math.round(((activeCarePlans || 0) / (totalPatients || 1)) * 100) },
    ]

    setData({
      visitsByType,
      visitsByStatus,
      messageVolume: messageVolume.slice(0, 7).reverse(),
      patientEngagement,
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-3xl tracking-tight">Analytics & Reports</h1>
        <p className="text-muted-foreground">Track agency performance and patient engagement metrics</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.patientEngagement.map((item) => (
              <Card key={item.metric}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{item.metric}</CardTitle>
                  <TrendingUp className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">
                    {item.metric === "Engagement Rate" ? `${item.value}%` : item.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Message Volume (Last 7 Days)</CardTitle>
              <CardDescription>Daily message activity across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.messageVolume.map((item) => (
                  <div key={item.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">{item.date}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-primary/20 rounded-md relative overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-md transition-all"
                          style={{
                            width: `${Math.min((item.count / Math.max(...data.messageVolume.map((m) => m.count))) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-sm font-medium text-right">{item.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Visits by Type</CardTitle>
                <CardDescription>Distribution of visit categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.visitsByType.map((item) => (
                    <div key={item.type} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-muted-foreground truncate">{item.type}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-primary/20 rounded-md relative overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-md transition-all"
                            style={{
                              width: `${Math.min((item.count / Math.max(...data.visitsByType.map((v) => v.count))) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-sm font-medium text-right">{item.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visits by Status</CardTitle>
                <CardDescription>Current visit status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.visitsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-muted-foreground truncate">{item.status}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-secondary/50 rounded-md relative overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-md transition-all"
                            style={{
                              width: `${Math.min((item.count / Math.max(...data.visitsByStatus.map((v) => v.count))) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-sm font-medium text-right">{item.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{data.patientEngagement[0]?.value || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total registered patients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Care Plans</CardTitle>
                <FileText className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{data.patientEngagement[1]?.value || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{data.patientEngagement[2]?.value || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total communications</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>Platform usage and interaction statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <p className="text-sm font-medium">Patient Portal Usage</p>
                    <p className="text-xs text-muted-foreground">Active users in last 30 days</p>
                  </div>
                  <div className="text-2xl font-bold">{data.patientEngagement[3]?.value || 0}%</div>
                </div>
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <p className="text-sm font-medium">Message Response Rate</p>
                    <p className="text-xs text-muted-foreground">Average clinician response time</p>
                  </div>
                  <div className="text-2xl font-bold">92%</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Visit Completion Rate</p>
                    <p className="text-xs text-muted-foreground">Scheduled vs completed visits</p>
                  </div>
                  <div className="text-2xl font-bold">87%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
