"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Heart, Droplet, TrendingUp } from "lucide-react"

export function DemoHealthMetrics() {
  // Mock vital signs data for demo
  const latestVital = {
    blood_pressure_systolic: 118,
    blood_pressure_diastolic: 76,
    heart_rate: 72,
    oxygen_saturation: 98,
  }

  const metrics = [
    {
      label: "Blood Pressure",
      value: `${latestVital.blood_pressure_systolic}/${latestVital.blood_pressure_diastolic}`,
      unit: "mmHg",
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
      status: "normal",
    },
    {
      label: "Heart Rate",
      value: latestVital.heart_rate,
      unit: "bpm",
      icon: Heart,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      status: "normal",
    },
    {
      label: "Oxygen Level",
      value: latestVital.oxygen_saturation,
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
                  <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
                </p>
              </div>
            </div>
            <div className="text-xs font-medium text-chart-4 bg-chart-4/10 px-2 py-1 rounded-full">{metric.status}</div>
          </div>
        ))}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Last updated:{" "}
          {new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </CardContent>
    </Card>
  )
}
