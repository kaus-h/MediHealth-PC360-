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
    const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()

    if (patient) {
      // Get clinicians from visits
      const { data: visits } = await supabase
        .from("visits")
        .select(
          `
          clinician:clinicians!visits_clinician_id_fkey(
            id,
            profile:profiles!clinicians_profile_id_fkey(id, first_name, last_name, role)
          )
        `,
        )
        .eq("patient_id", patient.id)

      const clinicians = visits
        ?.map((v) => v.clinician?.profile)
        .filter((p) => p)
        .filter((p, i, arr) => arr.findIndex((t) => t?.id === p?.id) === i)

      // Get caregivers
      const { data: patientCaregivers } = await supabase
        .from("patient_caregivers")
        .select(
          `
          caregiver:caregivers!patient_caregivers_caregiver_id_fkey(
            profile:profiles!caregivers_profile_id_fkey(id, first_name, last_name, role)
          )
        `,
        )
        .eq("patient_id", patient.id)
        .is("revoked_at", null)

      const caregivers = patientCaregivers?.map((pc) => pc.caregiver?.profile).filter((p) => p)

      potentialRecipients = [...(clinicians || []), ...(caregivers || [])]
    }
  } else if (profile.role === "caregiver") {
    // Caregivers can message patients they care for and their clinicians
    const { data: caregiver } = await supabase.from("caregivers").select("id").eq("profile_id", user.id).single()

    if (caregiver) {
      const { data: patientCaregivers } = await supabase
        .from("patient_caregivers")
        .select(
          `
          patient:patients!patient_caregivers_patient_id_fkey(
            profile:profiles!patients_profile_id_fkey(id, first_name, last_name, role)
          )
        `,
        )
        .eq("caregiver_id", caregiver.id)
        .is("revoked_at", null)

      const patients = patientCaregivers?.map((pc) => pc.patient?.profile).filter((p) => p)

      potentialRecipients = [...(patients || [])]
    }
  } else if (profile.role === "clinician") {
    // Clinicians can message their patients
    const { data: clinician } = await supabase.from("clinicians").select("id").eq("profile_id", user.id).single()

    if (clinician) {
      const { data: visits } = await supabase
        .from("visits")
        .select(
          `
          patient:patients!visits_patient_id_fkey(
            profile:profiles!patients_profile_id_fkey(id, first_name, last_name, role)
          )
        `,
        )
        .eq("clinician_id", clinician.id)

      const patients = visits
        ?.map((v) => v.patient?.profile)
        .filter((p) => p)
        .filter((p, i, arr) => arr.findIndex((t) => t?.id === p?.id) === i)

      potentialRecipients = [...(patients || [])]
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">Secure HIPAA-compliant communication with your care team</p>
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
