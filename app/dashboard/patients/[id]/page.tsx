"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, MapPin, AlertCircle, Calendar, FileText, Activity } from "lucide-react"
import Link from "next/link"

interface Patient {
  id: string
  full_name: string
  email: string
  phone: string
  date_of_birth: string
  address: string
  emergency_contact_name: string
  emergency_contact_phone: string
  insurance_provider: string
  insurance_policy_number: string
  medical_history: string
  allergies: string
  current_medications: string
}

interface Visit {
  id: string
  visit_type: string
  scheduled_date: string
  status: string
  notes: string
}

interface CarePlan {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  status: string
  goals: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [carePlans, setCarePlans] = useState<CarePlan[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPatientData()
  }, [patientId])

  async function fetchPatientData() {
    const { data: patientData } = await supabase.from("patients").select("*").eq("id", patientId).single()

    const { data: visitsData } = await supabase
      .from("visits")
      .select("*")
      .eq("patient_id", patientId)
      .order("scheduled_date", { ascending: false })
      .limit(10)

    const { data: carePlansData } = await supabase
      .from("care_plans")
      .select("*")
      .eq("patient_id", patientId)
      .order("start_date", { ascending: false })

    setPatient(patientData)
    setVisits(visitsData || [])
    setCarePlans(carePlansData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-muted-foreground">Loading patient details...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <AlertCircle className="size-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Patient not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-3xl tracking-tight text-foreground">{patient.full_name}</h1>
          <p className="text-muted-foreground">Patient ID: {patient.id.slice(0, 8)}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href={`/dashboard/messages?patient=${patient.id}`}>Send Message</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="hover:bg-primary/5 hover:text-primary hover:border-primary/30 bg-transparent"
          >
            <Link href={`/dashboard/visits?patient=${patient.id}`}>Schedule Visit</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Mail className="size-5 text-primary" />
            </div>
            <div>
              <CardDescription>Email</CardDescription>
              <CardTitle className="text-base text-foreground">{patient.email}</CardTitle>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/10">
              <Phone className="size-5 text-accent" />
            </div>
            <div>
              <CardDescription>Phone</CardDescription>
              <CardTitle className="text-base text-foreground">{patient.phone}</CardTitle>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary/10">
              <Calendar className="size-5 text-secondary" />
            </div>
            <div>
              <CardDescription>Date of Birth</CardDescription>
              <CardTitle className="text-base text-foreground">
                {new Date(patient.date_of_birth).toLocaleDateString()}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">Visit History</TabsTrigger>
          <TabsTrigger value="care-plans">Care Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Address</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="size-4" />
                  {patient.address}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Emergency Contact</p>
                <p className="text-sm text-muted-foreground">{patient.emergency_contact_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="size-4" />
                  {patient.emergency_contact_phone}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insurance Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium mb-1">Provider</p>
                <p className="text-sm text-muted-foreground">{patient.insurance_provider}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Policy Number</p>
                <p className="text-sm text-muted-foreground">{patient.insurance_policy_number}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Medical History</p>
                <p className="text-sm text-muted-foreground">
                  {patient.medical_history || "No medical history recorded"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Allergies</p>
                <p className="text-sm text-muted-foreground">{patient.allergies || "No known allergies"}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Current Medications</p>
                <p className="text-sm text-muted-foreground">
                  {patient.current_medications || "No current medications"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          {visits.length > 0 ? (
            visits.map((visit) => (
              <Card key={visit.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{visit.visit_type}</CardTitle>
                      <CardDescription>{new Date(visit.scheduled_date).toLocaleString()}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        visit.status === "completed"
                          ? "default"
                          : visit.status === "scheduled"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {visit.status}
                    </Badge>
                  </div>
                </CardHeader>
                {visit.notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{visit.notes}</p>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="size-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No visit history available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="care-plans" className="space-y-4">
          {carePlans.length > 0 ? (
            carePlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      <CardDescription>
                        {new Date(plan.start_date).toLocaleDateString()} -{" "}
                        {new Date(plan.end_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={plan.status === "active" ? "default" : "secondary"}>{plan.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  {plan.goals && (
                    <div>
                      <p className="text-sm font-medium mb-1">Goals</p>
                      <p className="text-sm text-muted-foreground">{plan.goals}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="size-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No care plans available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
