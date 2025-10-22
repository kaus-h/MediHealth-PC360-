import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CommunicationCenter } from "@/components/clinician/communication-center"

export default async function CommunicationCenterPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "clinician") {
    redirect("/dashboard")
  }

  // Get clinician ID
  const { data: clinician } = await supabase.from("clinicians").select("id").eq("profile_id", user.id).single()

  if (!clinician) {
    redirect("/dashboard")
  }

  // Fetch messages
  const { data: receivedMessages } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:profiles!messages_sender_id_fkey(id, first_name, last_name, role)
    `,
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const { data: sentMessages } = await supabase
    .from("messages")
    .select(
      `
      *,
      recipient:profiles!messages_recipient_id_fkey(id, first_name, last_name, role)
    `,
    )
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch patients for messaging
  const { data: patientRelationships } = await supabase
    .from("patient_clinicians")
    .select(
      `
      patient:patients!patient_clinicians_patient_id_fkey(
        id,
        profile:profiles!patients_profile_id_fkey(id, first_name, last_name, email)
      )
    `,
    )
    .eq("clinician_id", clinician.id)
    .is("revoked_at", null)

  const patients = patientRelationships?.map((r) => r.patient?.profile).filter(Boolean) || []

  // Fetch physician messages
  const patientIds =
    (
      await supabase
        .from("patient_clinicians")
        .select("patient_id")
        .eq("clinician_id", clinician.id)
        .is("revoked_at", null)
    ).data?.map((pc) => pc.patient_id) || []

  const { data: physicianMessages } =
    patientIds.length > 0
      ? await supabase
          .from("physician_messages")
          .select(
            `
          *,
          physician:physicians!physician_messages_physician_id_fkey(
            profile:profiles!physicians_profile_id_fkey(first_name, last_name)
          ),
          patient:patients!physician_messages_patient_id_fkey(
            profile:profiles!patients_profile_id_fkey(first_name, last_name)
          )
        `,
          )
          .in("patient_id", patientIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] }

  // Fetch vendor updates (DME orders)
  const { data: vendorUpdates } =
    patientIds.length > 0
      ? await supabase
          .from("dme_orders")
          .select(
            `
          *,
          vendor:vendors!dme_orders_vendor_id_fkey(company_name),
          medical_order:medical_orders!dme_orders_medical_order_id_fkey(
            patient:patients!medical_orders_patient_id_fkey(
              profile:profiles!patients_profile_id_fkey(first_name, last_name)
            )
          )
        `,
          )
          .in(
            "medical_order_id",
            (
              await supabase
                .from("medical_orders")
                .select("id")
                .in("patient_id", patientIds)
                .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            ).data?.map((mo) => mo.id) || [],
          )
          .order("updated_at", { ascending: false })
          .limit(20)
      : { data: [] }

  return (
    <CommunicationCenter
      receivedMessages={receivedMessages || []}
      sentMessages={sentMessages || []}
      physicianMessages={physicianMessages || []}
      vendorUpdates={vendorUpdates || []}
      patients={patients}
      currentUserId={user.id}
    />
  )
}
