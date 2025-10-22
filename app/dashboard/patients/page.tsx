"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, User, Calendar, FileText, MessageSquare, Loader2 } from "lucide-react"
import Link from "next/link"

interface Patient {
  id: string
  profile_id: string
  medical_record_number: string
  primary_diagnosis: string
  status: string
  admission_date: string
  insurance_provider: string
  insurance_policy_number: string
  created_at: string
  access_type: string
  profile: {
    first_name: string
    last_name: string
    email: string
    phone: string
    date_of_birth: string
  }
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPatients()
  }, [])

  async function fetchPatients() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // The view handles access control for clinicians, caregivers, and physicians
    const { data: patientsData, error: patientsError } = await supabase
      .from("accessible_patients")
      .select("*")
      .eq("access_type", "clinician")
      .order("created_at", { ascending: false })

    if (patientsError) {
      console.error("[v0] Error fetching patients:", patientsError)
      setLoading(false)
      return
    }

    console.log("[v0] Found patients from view:", patientsData?.length || 0)

    if (!patientsData || patientsData.length === 0) {
      setLoading(false)
      return
    }

    // Fetch profiles for patients
    const profileIds = patientsData.map((p) => p.profile_id)
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, phone, date_of_birth")
      .in("id", profileIds)

    if (profilesError) {
      console.error("[v0] Error fetching profiles:", profilesError)
      setLoading(false)
      return
    }

    console.log("[v0] Found profiles:", profilesData?.length || 0)

    // Combine the data
    const patientList = patientsData.map((patient) => {
      const profile = profilesData?.find((p) => p.id === patient.profile_id)
      return {
        ...patient,
        profile: profile || {
          first_name: "Unknown",
          last_name: "User",
          email: "",
          phone: "",
          date_of_birth: "",
        },
      }
    })

    console.log("[v0] Final patient list:", patientList.length)
    setPatients(patientList)
    setLoading(false)
  }

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.profile?.first_name} ${patient.profile?.last_name}`.toLowerCase()
    const email = patient.profile?.email?.toLowerCase() || ""
    return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-3xl tracking-tight text-foreground">My Patients</h1>
        <p className="text-muted-foreground">Manage your patient caseload and access care information</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-lg hover:border-primary/30 transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      {patient.profile?.first_name} {patient.profile?.last_name}
                    </CardTitle>
                    <CardDescription className="text-sm">{patient.profile?.email}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>
                    DOB:{" "}
                    {patient.profile?.date_of_birth
                      ? new Date(patient.profile.date_of_birth).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="size-4" />
                  <span>{patient.insurance_provider || "No insurance"}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href={`/dashboard/patients/${patient.id}`}>View Details</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="hover:bg-primary/5 hover:text-primary hover:border-primary/30 bg-transparent"
                >
                  <Link href={`/dashboard/messages?patient=${patient.id}`}>
                    <MessageSquare className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchTerm ? "No patients found matching your search" : "No patients assigned yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
