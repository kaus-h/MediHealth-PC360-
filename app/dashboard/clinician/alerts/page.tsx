import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AlertsManagement } from "@/components/clinician/alerts-management"

export default async function AlertsPage() {
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

  // Fetch all alerts for clinician's patients
  const { data: patientIds } = await supabase
    .from("patient_clinicians")
    .select("patient_id")
    .eq("clinician_id", clinician.id)
    .is("revoked_at", null)

  const patientIdList = patientIds?.map((p) => p.patient_id) || []

  const { data: alerts } =
    patientIdList.length > 0
      ? await supabase
          .from("alerts")
          .select(
            `
          *,
          patient:patients!alerts_patient_id_fkey(
            id,
            profile:profiles!patients_profile_id_fkey(first_name, last_name)
          )
        `,
          )
          .in("patient_id", patientIdList)
          .order("created_at", { ascending: false })
      : { data: [] }

  return <AlertsManagement alerts={alerts || []} clinicianId={clinician.id} />
}
