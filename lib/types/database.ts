export type UserRole = "patient" | "caregiver" | "clinician" | "agency_admin" | "vendor"

export type VisitType = "nursing" | "physical_therapy" | "occupational_therapy" | "speech_therapy" | "aide" | "other"

export type VisitStatus = "scheduled" | "en_route" | "in_progress" | "completed" | "cancelled" | "no_show"

export type DocumentType = "discharge_summary" | "insurance_card" | "order" | "consent_form" | "lab_result" | "other"

export type NotificationType =
  | "visit_reminder"
  | "visit_update"
  | "message"
  | "document"
  | "care_plan_update"
  | "system"

export type NotificationPriority = "low" | "normal" | "high" | "urgent"

export interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: UserRole
  date_of_birth?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  profile_image_url?: string
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  profile_id: string
  medical_record_number?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  insurance_provider?: string
  insurance_policy_number?: string
  primary_diagnosis?: string
  admission_date?: string
  discharge_date?: string
  status: "active" | "discharged" | "inactive"
  created_at: string
  updated_at: string
}

export interface PatientClinician {
  id: string
  patient_id: string
  clinician_id: string
  relationship_type: "primary" | "assigned" | "consulting"
  access_level: "standard" | "full"
  can_view_records: boolean
  can_message: boolean
  can_schedule: boolean
  can_document: boolean
  assigned_at: string
  assigned_by?: string
  revoked_at?: string
  created_at: string
  updated_at: string
}

export type InvitationType = "patient_to_clinician" | "clinician_to_patient"
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired" | "cancelled"

export interface Invitation {
  id: string
  inviter_id: string
  invitee_email: string
  invitee_id?: string
  invitation_type: InvitationType
  patient_id?: string
  clinician_id?: string
  status: InvitationStatus
  message?: string
  expires_at: string
  responded_at?: string
  created_at: string
  updated_at: string
}

export interface Visit {
  id: string
  patient_id: string
  clinician_id: string
  visit_type: VisitType
  scheduled_start: string
  scheduled_end: string
  actual_start?: string
  actual_end?: string
  status: VisitStatus
  visit_notes?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject?: string
  body: string
  is_read: boolean
  read_at?: string
  parent_message_id?: string
  patient_context_id?: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  is_read: boolean
  read_at?: string
  action_url?: string
  created_at: string
}
