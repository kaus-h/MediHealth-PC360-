import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Heart, Droplet, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

interface HealthMetricsProps {
  patientIds: string[]
  isDemo?: boolean
}

export async function HealthMetrics({ patientIds, isDemo = false }: HealthMetricsProps) {
  const supabase = await createClient()

  let visitDocs = null

  if (isDemo) {
    visitDocs = [
      {
        vital_signs: {
          blood_pressure_systolic: 118,
          blood_pressure_diastolic: 76,
          heart_rate: 72,
          oxygen_saturation: 98,
        },
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ]
  } else if (patientIds.length > 0) {
    // First get visit IDs for the patients
    const { data: visits } = await supabase.from("visits").select("id").in("patient_id", patientIds)

    const visitIds = visits?.map((v) => v.id) || []

    // Then fetch visit documentation for those visits
    if (visitIds.length > 0) {
      const { data } = await supabase
        .from("visit_documentation")
        .select("vital_signs, created_at")
        .in("visit_id", visitIds)
        .not("vital_signs", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)

      visitDocs = data
    }
  }

  const latestVital = visitDocs?.[0]?.vital_signs as any

  const metrics = [
    {
      label: "Blood Pressure",
      value:
        latestVital?.blood_pressure_systolic && latestVital?.blood_pressure_diastolic
          ? `${latestVital.blood_pressure_systolic}/${latestVital.blood_pressure_diastolic}`
          : "N/A",
      unit: "mmHg",
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
      status: "normal",
    },
    {
      label: "Heart Rate",
      value: latestVital?.heart_rate || "N/A",
      unit: "bpm",
      icon: Heart,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      status: "normal",
    },
    {
      label: "Oxygen Level",
      value: latestVital?.oxygen_saturation || "N/A",
      unit: "%",
      icon: Droplet,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      status: "normal",
    },
  ]

  return (
    <Card className="border-border/50 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Health Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors bg-card/50"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-xl ${metric.bgColor} p-3`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold text-foreground">
                  {metric.value}
                  {metric.value !== "N/A" && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-xs font-medium text-chart-4 bg-chart-4/10 px-2 py-1 rounded-full">{metric.status}</div>
          </div>
        ))}

        {!latestVital && (
          <p className="text-sm text-muted-foreground text-center py-8">No recent health metrics available</p>
        )}

        {latestVital && visitDocs?.[0]?.created_at && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Last updated:{" "}
            {new Date(visitDocs[0].created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
