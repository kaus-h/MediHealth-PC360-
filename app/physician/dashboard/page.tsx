import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Mail, Users, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

export default async function PhysicianDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "physician") {
    redirect("/dashboard")
  }

  const { data: physician } = await supabase.from("physicians").select("*").eq("profile_id", user.id).single()

  if (!physician) {
    redirect("/dashboard")
  }

  // Get dashboard summary
  const { data: summary } = await supabase.rpc("get_physician_dashboard_summary", {
    p_physician_id: physician.id,
  })

  // Get pending orders
  const { data: pendingOrders } = await supabase
    .from("medical_orders")
    .select(
      `
      *,
      patient:patients!medical_orders_patient_id_fkey(
        profile:profiles!patients_profile_id_fkey(first_name, last_name)
      )
    `,
    )
    .eq("physician_id", physician.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get unread messages
  const { data: unreadMessages } = await supabase
    .from("physician_messages")
    .select(
      `
      *,
      sender:profiles!physician_messages_sender_id_fkey(first_name, last_name),
      patient:patients!physician_messages_patient_id_fkey(
        profile:profiles!patients_profile_id_fkey(first_name, last_name)
      )
    `,
    )
    .eq("physician_id", physician.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5)

  const summaryData = summary as any

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Physician Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, Dr. {profile.last_name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.pending_orders || 0}</div>
            <p className="text-xs text-muted-foreground">Require your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.unread_messages || 0}</div>
            <p className="text-xs text-muted-foreground">From care teams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.active_patients || 0}</div>
            <p className="text-xs text-muted-foreground">Under your care</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.urgent_alerts || 0}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Orders</CardTitle>
              <Link href="/physician/orders">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>Orders awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingOrders && pendingOrders.length > 0 ? (
              <div className="space-y-3">
                {pendingOrders.map((order: any) => (
                  <div key={order.id} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">
                          {order.order_type.replace(/_/g, " ")}
                        </Badge>
                        {order.priority !== "routine" && (
                          <Badge variant="destructive" className="capitalize">
                            {order.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">
                        {order.patient.profile.first_name} {order.patient.profile.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{order.order_details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No pending orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unread Messages */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Unread Messages</CardTitle>
              <Link href="/physician/messages">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>Messages from care teams</CardDescription>
          </CardHeader>
          <CardContent>
            {unreadMessages && unreadMessages.length > 0 ? (
              <div className="space-y-3">
                {unreadMessages.map((message: any) => (
                  <div key={message.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">
                          {message.sender.first_name} {message.sender.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Re: {message.patient.profile.first_name} {message.patient.profile.last_name}
                        </p>
                      </div>
                      {message.priority !== "normal" && (
                        <Badge variant="destructive" className="text-xs capitalize">
                          {message.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1">{message.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{message.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No unread messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
