"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Heart, Droplet, Thermometer } from "lucide-react"

export default function DemoHealthRecordsPage() {
  const mockVitals = [
    {
      type: "Blood Pressure",
      value: "120/80",
      unit: "mmHg",
      status: "normal",
      icon: Heart,
      date: "2 days ago",
    },
    {
      type: "Heart Rate",
      value: "72",
      unit: "bpm",
      status: "normal",
      icon: Activity,
      date: "2 days ago",
    },
    {
      type: "Blood Glucose",
      value: "95",
      unit: "mg/dL",
      status: "normal",
      icon: Droplet,
      date: "3 days ago",
    },
    {
      type: "Temperature",
      value: "98.6",
      unit: "°F",
      status: "normal",
      icon: Thermometer,
      date: "2 days ago",
    },
  ]

  const mockMedications = [
    {
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      prescriber: "Dr. Sarah Johnson",
    },
    {
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily with meals",
      prescriber: "Dr. Sarah Johnson",
    },
  ]

  const mockConditions = [
    {
      name: "Hypertension",
      diagnosed: "2020",
      status: "Controlled",
    },
    {
      name: "Type 2 Diabetes",
      diagnosed: "2019",
      status: "Managed",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Health Records</h1>
        <p className="text-muted-foreground mt-1">View your medical history and vital signs</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {mockVitals.map((vital) => {
          const Icon = vital.icon
          return (
            <Card key={vital.type}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{vital.type}</p>
                    <p className="text-2xl font-bold">
                      {vital.value} <span className="text-sm font-normal text-muted-foreground">{vital.unit}</span>
                    </p>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Normal
                    </Badge>
                  </div>
                  <div className="rounded-full bg-blue-100 p-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">{vital.date}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Medications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockMedications.map((med, index) => (
              <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                <h3 className="font-semibold">{med.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {med.dosage} - {med.frequency}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Prescribed by {med.prescriber}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockConditions.map((condition, index) => (
              <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{condition.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Diagnosed in {condition.diagnosed}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {condition.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
