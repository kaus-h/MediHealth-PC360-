import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MessagesList } from "@/components/messages/messages-list"
import { NewMessageButton } from "@/components/messages/new-message-button"

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Fetch all messages (sent and received)
  const { data: receivedMessages } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:profiles!messages_sender_id_fkey(id, first_name, last_name, role),
      recipient:profiles!messages_recipient_id_fkey(id, first_name, last_name, role)
    `,
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })

  const { data: sentMessages } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:profiles!messages_sender_id_fkey(id, first_name, last_name, role),
      recipient:profiles!messages_recipient_id_fkey(id, first_name, last_name, role)
    `,
    )
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch potential recipients based on role
  let potentialRecipients: any[] = []

  if (profile.role === "patient") {
    // Patients can message their clinicians and caregivers
    const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).maybeSingle()

    if (patient) {
      const { data: patientClinicians } = await supabase
        .from("patient_clinicians")
        .select("clinician_id")
        .eq("patient_id", patient.id)
        .is("revoked_at", null)

      if (patientClinicians && patientClinicians.length > 0) {
        const clinicianIds = patientClinicians.map((pc) => pc.clinician_id)

        const { data: cliniciansData } = await supabase.from("clinicians").select("profile_id").in("id", clinicianIds)

        if (cliniciansData && cliniciansData.length > 0) {
          const profileIds = cliniciansData.map((c) => c.profile_id)

          const { data: clinicianProfiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, role")
            .in("id", profileIds)

          potentialRecipients = [...(clinicianProfiles || [])]
        }
      }

      // Get caregivers
      const { data: patientCaregivers } = await supabase
        .from("patient_caregivers")
        .select("caregiver_id")
        .eq("patient_id", patient.id)
        .is("revoked_at", null)

      if (patientCaregivers && patientCaregivers.length > 0) {
        const caregiverIds = patientCaregivers.map((pc) => pc.caregiver_id)

        const { data: caregiversData } = await supabase.from("caregivers").select("profile_id").in("id", caregiverIds)

        if (caregiversData && caregiversData.length > 0) {
          const profileIds = caregiversData.map((c) => c.profile_id)

          const { data: caregiverProfiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, role")
            .in("id", profileIds)

          potentialRecipients = [...potentialRecipients, ...(caregiverProfiles || [])]
        }
      }
    }
  } else if (profile.role === "caregiver") {
    // Caregivers can message patients they care for and their clinicians
    const { data: caregiver } = await supabase.from("caregivers").select("id").eq("profile_id", user.id).maybeSingle()

    if (caregiver) {
      const { data: patientCaregivers } = await supabase
        .from("patient_caregivers")
        .select("patient_id")
        .eq("caregiver_id", caregiver.id)
        .is("revoked_at", null)

      if (patientCaregivers && patientCaregivers.length > 0) {
        const patientIds = patientCaregivers.map((pc) => pc.patient_id)

        const { data: patientsData } = await supabase.from("patients").select("profile_id").in("id", patientIds)

        if (patientsData && patientsData.length > 0) {
          const profileIds = patientsData.map((p) => p.profile_id)

          const { data: patientProfiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, role")
            .in("id", profileIds)

          potentialRecipients = [...(patientProfiles || [])]
        }
      }
    }
  } else if (profile.role === "clinician") {
    const { data: accessiblePatients } = await supabase
      .from("accessible_patients")
      .select("profile_id")
      .eq("access_type", "clinician")

    if (accessiblePatients && accessiblePatients.length > 0) {
      const profileIds = accessiblePatients.map((p) => p.profile_id)

      const { data: patientProfiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in("id", profileIds)

      potentialRecipients = [...(patientProfiles || [])]
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">Secure HIPAA-compliant communication</p>
        </div>
        <NewMessageButton recipients={potentialRecipients} currentUserId={user.id} />
      </div>

      <MessagesList
        receivedMessages={receivedMessages || []}
        sentMessages={sentMessages || []}
        currentUserId={user.id}
      />
    </div>
  )
}
