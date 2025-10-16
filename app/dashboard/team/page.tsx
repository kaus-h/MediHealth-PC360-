"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SendInvitationDialog } from "@/components/invitations/send-invitation-dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Users, Mail, Calendar, Loader2 } from "lucide-react"
import type { Profile } from "@/lib/types/database"

interface TeamMember {
  id: string
  profile: Profile
  relationship_type: string
  assigned_at: string
  specialization?: string
  diagnosis?: string
}

export default function TeamPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [clinicianId, setClinicianId] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    try {
      const supabase = createClient()

      // Get current user profile
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      console.log("[v0] Loading team data for user:", user.id)

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!profileData) return
      setProfile(profileData)

      console.log("[v0] User profile:", profileData)

      // Get patient or clinician ID based on role
      if (profileData.role === "patient") {
        const { data: patientData } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()

        console.log("[v0] Patient data:", patientData)

        if (patientData) {
          setPatientId(patientData.id)
          await loadClinicians(patientData.id)
        }
      } else if (profileData.role === "clinician") {
        const { data: clinicianData } = await supabase
          .from("clinicians")
          .select("id")
          .eq("profile_id", user.id)
          .single()

        console.log("[v0] Clinician data:", clinicianData)

        if (clinicianData) {
          setClinicianId(clinicianData.id)
          await loadPatients(clinicianData.id)
        }
      }
    } catch (error) {
      console.error("Error loading team data:", error)
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadClinicians = async (patientId: string) => {
    const supabase = createClient()

    console.log("[v0] Loading clinicians for patient_id:", patientId)

    const { data: relationships, error: relError } = await supabase
      .from("patient_clinicians")
      .select("id, clinician_id, relationship_type, assigned_at")
      .eq("patient_id", patientId)
      .is("revoked_at", null)

    console.log("[v0] Relationships data:", { relationships, relError })

    if (relError || !relationships || relationships.length === 0) {
      console.log("[v0] No relationships found")
      setTeamMembers([])
      return
    }

    const clinicianIds = relationships.map((r) => r.clinician_id).filter(Boolean)
    console.log("[v0] Clinician IDs:", clinicianIds)

    if (clinicianIds.length === 0) {
      setTeamMembers([])
      return
    }

    const { data: cliniciansData, error: cliniciansError } = await supabase
      .from("accessible_clinicians")
      .select("id, profile_id, specialization")
      .in("id", clinicianIds)

    console.log("[v0] Accessible clinicians data:", { cliniciansData, cliniciansError })

    if (cliniciansError || !cliniciansData || cliniciansData.length === 0) {
      console.log("[v0] No accessible clinicians found")
      setTeamMembers([])
      return
    }

    const profileIds = cliniciansData.map((c) => c.profile_id).filter(Boolean)
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", profileIds)

    console.log("[v0] Profiles data:", { profilesData, profilesError })

    if (profilesError || !profilesData) {
      setTeamMembers([])
      return
    }

    const members = relationships
      .map((rel) => {
        const clinician = cliniciansData.find((c) => c.id === rel.clinician_id)
        if (!clinician) return null

        const profile = profilesData.find((p) => p.id === clinician.profile_id)
        if (!profile) return null

        return {
          id: rel.id,
          profile,
          relationship_type: rel.relationship_type,
          assigned_at: rel.assigned_at,
          specialization: clinician.specialization,
        }
      })
      .filter(Boolean) as TeamMember[]

    console.log("[v0] Processed clinicians:", members)
    setTeamMembers(members)
  }

  const loadPatients = async (clinicianId: string) => {
    const supabase = createClient()

    console.log("[v0] Loading patients for clinician_id:", clinicianId)

    const { data: relationships, error: relError } = await supabase
      .from("patient_clinicians")
      .select("id, patient_id, relationship_type, assigned_at")
      .eq("clinician_id", clinicianId)
      .is("revoked_at", null)

    console.log("[v0] Relationships data:", { relationships, relError })

    if (relError || !relationships || relationships.length === 0) {
      console.log("[v0] No relationships found")
      setTeamMembers([])
      return
    }

    const patientIds = relationships.map((r) => r.patient_id).filter(Boolean)
    console.log("[v0] Patient IDs:", patientIds)

    if (patientIds.length === 0) {
      setTeamMembers([])
      return
    }

    const { data: patientsData, error: patientsError } = await supabase
      .from("accessible_patients")
      .select("id, profile_id, primary_diagnosis")
      .in("id", patientIds)

    console.log("[v0] Accessible patients data:", { patientsData, patientsError })

    if (patientsError || !patientsData || patientsData.length === 0) {
      console.log("[v0] No accessible patients found")
      setTeamMembers([])
      return
    }

    const profileIds = patientsData.map((p) => p.profile_id).filter(Boolean)
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", profileIds)

    console.log("[v0] Profiles data:", { profilesData, profilesError })

    if (profilesError || !profilesData) {
      setTeamMembers([])
      return
    }

    const members = relationships
      .map((rel) => {
        const patient = patientsData.find((p) => p.id === rel.patient_id)
        if (!patient) return null

        const profile = profilesData.find((p) => p.id === patient.profile_id)
        if (!profile) return null

        return {
          id: rel.id,
          profile,
          relationship_type: rel.relationship_type,
          assigned_at: rel.assigned_at,
          diagnosis: patient.primary_diagnosis,
        }
      })
      .filter(Boolean) as TeamMember[]

    console.log("[v0] Processed patients:", members)
    setTeamMembers(members)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Unable to load profile</p>
      </div>
    )
  }

  const isPatient = profile.role === "patient"
  const isClinician = profile.role === "clinician"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isPatient ? "My Care Team" : "My Patients"}</h1>
          <p className="text-muted-foreground">
            {isPatient ? "Manage your healthcare providers" : "Manage your patient caseload"}
          </p>
        </div>
        {(isPatient || isClinician) && (
          <SendInvitationDialog
            userRole={profile.role as "patient" | "clinician"}
            userId={profile.id}
            patientId={patientId || undefined}
            clinicianId={clinicianId || undefined}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isPatient ? "My Clinicians" : "My Patients"}
          </CardTitle>
          <CardDescription>
            {teamMembers.length} {isPatient ? "clinician" : "patient"}
            {teamMembers.length !== 1 ? "s" : ""} connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
              <p className="text-muted-foreground mb-4">
                {isPatient ? "Invite clinicians to join your care team" : "Invite patients to connect with you"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-base sm:text-lg font-semibold text-primary">
                        {member.profile.first_name[0]}
                        {member.profile.last_name[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm sm:text-base truncate">
                        {member.profile.first_name} {member.profile.last_name}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.profile.email}</p>
                      {member.specialization && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.specialization}</p>
                      )}
                      {member.diagnosis && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.diagnosis}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {member.relationship_type}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1 sm:gap-2 bg-transparent text-xs sm:text-sm">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Message</span>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 sm:gap-2 bg-transparent text-xs sm:text-sm">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Schedule</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
