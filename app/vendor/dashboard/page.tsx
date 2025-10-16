import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Clock, CheckCircle, TrendingUp, Truck, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function VendorDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "vendor") {
    redirect("/dashboard")
  }

  const { data: vendor } = await supabase.from("vendors").select("*").eq("profile_id", user.id).single()

  if (!vendor) {
    redirect("/dashboard")
  }

  // Get dashboard summary
  const { data: summary } = await supabase.rpc("get_vendor_dashboard_summary", {
    p_vendor_id: vendor.id,
  })

  // Get pending orders
  const { data: pendingOrders } = await supabase
    .from("dme_orders")
    .select(
      `
      *,
      medical_order:medical_orders!dme_orders_medical_order_id_fkey(
        *,
        patient:patients!medical_orders_patient_id_fkey(
          profile:profiles!patients_profile_id_fkey(first_name, last_name, phone)
        ),
        physician:physicians!medical_orders_physician_id_fkey(
          profile:profiles!physicians_profile_id_fkey(first_name, last_name)
        )
      )
    `,
    )
    .eq("vendor_id", vendor.id)
    .eq("status", "pending_vendor")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get in-progress orders
  const { data: inProgressOrders } = await supabase
    .from("dme_orders")
    .select(
      `
      *,
      medical_order:medical_orders!dme_orders_medical_order_id_fkey(
        *,
        patient:patients!medical_orders_patient_id_fkey(
          profile:profiles!patients_profile_id_fkey(first_name, last_name)
        )
      )
    `,
    )
    .eq("vendor_id", vendor.id)
    .in("status", ["vendor_accepted", "in_preparation", "shipped"])
    .order("estimated_delivery_date", { ascending: true })
    .limit(5)

  const summaryData = summary as any

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_vendor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      vendor_accepted: "bg-blue-100 text-blue-800 border-blue-200",
      in_preparation: "bg-purple-100 text-purple-800 border-purple-200",
      shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      setup_complete: "bg-emerald-100 text-emerald-800 border-emerald-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight">Vendor Dashboard</h1>
        <p className="text-muted-foreground mt-1">{vendor.company_name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.pending_orders || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.in_progress || 0}</div>
            <p className="text-xs text-muted-foreground">Active orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.completed_this_month || 0}</div>
            <p className="text-xs text-muted-foreground">Deliveries made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.avg_delivery_time || 0} days</div>
            <p className="text-xs text-muted-foreground">Last 90 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>New Orders</CardTitle>
              <Link href="/vendor/orders?status=pending">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>Orders awaiting your acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingOrders && pendingOrders.length > 0 ? (
              <div className="space-y-3">
                {pendingOrders.map((order: any) => (
                  <div key={order.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{order.equipment_type}</p>
                        <p className="text-sm text-muted-foreground">
                          Patient: {order.medical_order.patient.profile.first_name}{" "}
                          {order.medical_order.patient.profile.last_name}
                        </p>
                        {order.medical_order.physician && (
                          <p className="text-xs text-muted-foreground">
                            Ordered by: Dr. {order.medical_order.physician.profile.last_name}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                    </div>
                    {order.equipment_description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{order.equipment_description}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Qty: {order.quantity} • {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Decline
                        </Button>
                        <Button size="sm">Accept</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No pending orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* In Progress Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>In Progress</CardTitle>
              <Link href="/vendor/orders?status=in_progress">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>Orders being fulfilled</CardDescription>
          </CardHeader>
          <CardContent>
            {inProgressOrders && inProgressOrders.length > 0 ? (
              <div className="space-y-3">
                {inProgressOrders.map((order: any) => (
                  <div key={order.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{order.equipment_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.medical_order.patient.profile.first_name}{" "}
                          {order.medical_order.patient.profile.last_name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                    </div>
                    {order.tracking_number && (
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Tracking: {order.tracking_number}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      {order.estimated_delivery_date ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>ETA: {new Date(order.estimated_delivery_date).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No ETA set</span>
                      )}
                      <Button size="sm" variant="outline">
                        Update Status
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No orders in progress</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
