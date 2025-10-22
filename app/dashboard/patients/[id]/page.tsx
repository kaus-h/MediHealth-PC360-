"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, MapPin, AlertCircle, Calendar, FileText, Activity, Pill, Upload, Plus } from "lucide-react"
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
  medical_record_number?: string
  profile?: {
    first_name: string
    last_name: string
    email: string
    phone: string
    date_of_birth: string
    address: string
    city: string
    state: string
    zip_code: string
  }
  emergency_contact_relationship?: string
  primary_diagnosis?: string
  status?: string
  admission_date?: string
}

interface Visit {
  id: string
  visit_type: string
  scheduled_start: string
  status: string
  visit_notes: string
}

interface CarePlan {
  id: string
  title: string
  description: string
  start_date: string
  end_date?: string
  status: string
  goals: any[]
}

interface Document {
  id: string
  file_name: string
  document_type: string
  created_at: string
  description?: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [carePlans, setCarePlans] = useState<CarePlan[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPatientData()
  }, [patientId])

  async function fetchPatientData() {
    const { data: patientData } = await supabase
      .from("patients")
      .select(
        `
        *,
        profile:profiles!patients_profile_id_fkey(
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          address,
          city,
          state,
          zip_code
        )
      `,
      )
      .eq("id", patientId)
      .single()

    const { data: visitsData } = await supabase
      .from("visits")
      .select("*")
      .eq("patient_id", patientId)
      .order("scheduled_start", { ascending: false })
      .limit(10)

    const { data: carePlansData } = await supabase
      .from("care_plans")
      .select(
        `
        *,
        goals:care_plan_goals(*)
      `,
      )
      .eq("patient_id", patientId)
      .order("start_date", { ascending: false })

    const { data: medicationsData } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .order("name")

    const { data: documentsData } = await supabase
      .from("documents")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })

    setPatient(patientData)
    setVisits(visitsData || [])
    setCarePlans(carePlansData || [])
    setMedications(medicationsData || [])
    setDocuments(documentsData || [])
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
          <h1 className="font-semibold text-3xl tracking-tight text-foreground">
            {patient.profile?.first_name} {patient.profile?.last_name}
          </h1>
          <p className="text-muted-foreground">MRN: {patient.medical_record_number || patient.id.slice(0, 8)}</p>
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
              <CardTitle className="text-base text-foreground">{patient.profile?.email}</CardTitle>
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
              <CardTitle className="text-base text-foreground">{patient.profile?.phone || "N/A"}</CardTitle>
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
                {patient.profile?.date_of_birth ? new Date(patient.profile.date_of_birth).toLocaleDateString() : "N/A"}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="visits">Visit History</TabsTrigger>
          <TabsTrigger value="care-plans">Care Plans</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
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
                  {patient.profile?.address || "N/A"}
                  {patient.profile?.city && `, ${patient.profile.city}`}
                  {patient.profile?.state && `, ${patient.profile.state}`}
                  {patient.profile?.zip_code && ` ${patient.profile.zip_code}`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Emergency Contact</p>
                <p className="text-sm text-muted-foreground">{patient.emergency_contact_name || "N/A"}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="size-4" />
                  {patient.emergency_contact_phone || "N/A"}
                </p>
                {patient.emergency_contact_relationship && (
                  <p className="text-sm text-muted-foreground">
                    Relationship: {patient.emergency_contact_relationship}
                  </p>
                )}
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
                <p className="text-sm text-muted-foreground">{patient.insurance_provider || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Policy Number</p>
                <p className="text-sm text-muted-foreground">{patient.insurance_policy_number || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Primary Diagnosis</p>
                <p className="text-sm text-muted-foreground">{patient.primary_diagnosis || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <Badge variant={patient.status === "active" ? "default" : "secondary"}>{patient.status}</Badge>
              </div>
              {patient.admission_date && (
                <div>
                  <p className="text-sm font-medium mb-1">Admission Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(patient.admission_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Active Medications</h3>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </div>
          {medications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {medications.map((med: any) => (
                <Card key={med.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{med.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {med.dosage} • {med.frequency}
                        </CardDescription>
                      </div>
                      <Pill className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {med.instructions && <p className="text-sm text-muted-foreground">{med.instructions}</p>}
                    {med.prescribing_physician && (
                      <p className="text-sm">
                        <span className="font-medium">Prescribed by:</span> {med.prescribing_physician}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Started {new Date(med.start_date).toLocaleDateString()}
                      </span>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pill className="size-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No active medications</p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Medication
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          {visits.length > 0 ? (
            visits.map((visit) => (
              <Card key={visit.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg capitalize">{visit.visit_type.replace(/_/g, " ")}</CardTitle>
                      <CardDescription>{new Date(visit.scheduled_start).toLocaleString()}</CardDescription>
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
                {visit.visit_notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{visit.visit_notes}</p>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Care Plans</h3>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Care Plan
            </Button>
          </div>
          {carePlans.length > 0 ? (
            carePlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      <CardDescription>
                        {new Date(plan.start_date).toLocaleDateString()}
                        {plan.end_date && ` - ${new Date(plan.end_date).toLocaleDateString()}`}
                      </CardDescription>
                    </div>
                    <Badge variant={plan.status === "active" ? "default" : "secondary"}>{plan.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {plan.description && (
                    <div>
                      <p className="text-sm font-medium mb-1">Description</p>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  )}
                  {plan.goals && plan.goals.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Goals ({plan.goals.length})</p>
                      <div className="space-y-1">
                        {plan.goals.slice(0, 3).map((goal: any) => (
                          <p key={goal.id} className="text-sm text-muted-foreground">
                            • {goal.goal_text}
                          </p>
                        ))}
                        {plan.goals.length > 3 && (
                          <p className="text-sm text-muted-foreground">+ {plan.goals.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="size-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No care plans available</p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Care Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Patient Documents</h3>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
          {documents.length > 0 ? (
            <div className="grid gap-4">
              {documents.map((doc: any) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                          <FileText className="size-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{doc.file_name}</CardTitle>
                          <CardDescription>
                            {doc.document_type?.replace(/_/g, " ")} • {new Date(doc.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </CardHeader>
                  {doc.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="size-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No documents uploaded</p>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload First Document
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
