import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentsList } from "@/components/documents/documents-list"
import { UploadDocumentButton } from "@/components/documents/upload-document-button"

export default async function DocumentsPage() {
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

  // Determine patient IDs based on role
  let relevantPatientIds: string[] = []
  let canUpload = false

  if (profile.role === "patient") {
    const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()
    if (patient) {
      relevantPatientIds = [patient.id]
      canUpload = true
    }
  } else if (profile.role === "caregiver") {
    const { data: caregiver } = await supabase.from("caregivers").select("id").eq("profile_id", user.id).single()
    if (caregiver) {
      const { data: patientCaregivers } = await supabase
        .from("patient_caregivers")
        .select("patient_id")
        .eq("caregiver_id", caregiver.id)
        .is("revoked_at", null)
      relevantPatientIds = patientCaregivers?.map((pc) => pc.patient_id) || []
      canUpload = true
    }
  } else if (profile.role === "clinician") {
    const { data: clinician } = await supabase.from("clinicians").select("id").eq("profile_id", user.id).single()
    if (clinician) {
      const { data: visits } = await supabase.from("visits").select("patient_id").eq("clinician_id", clinician.id)

      relevantPatientIds = [...new Set(visits?.map((v) => v.patient_id) || [])]
      canUpload = true
    }
  }

  // Fetch documents
  const { data: documents } = await supabase
    .from("documents")
    .select(
      `
      *,
      uploader:profiles!documents_uploaded_by_fkey(first_name, last_name, role)
    `,
    )
    .in("patient_id", relevantPatientIds)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">Access and manage your health documents</p>
        </div>
        {canUpload && relevantPatientIds.length > 0 && (
          <UploadDocumentButton patientIds={relevantPatientIds} currentUserId={user.id} />
        )}
      </div>

      <DocumentsList documents={documents || []} />
    </div>
  )
}
