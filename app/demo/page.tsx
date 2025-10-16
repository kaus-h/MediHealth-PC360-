"use client"

import { StatCard } from "@/components/dashboard/stat-card"
import { DemoUpcomingVisits } from "@/components/demo/demo-upcoming-visits"
import { DemoRecentMessages } from "@/components/demo/demo-recent-messages"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import { DemoQuickActions } from "@/components/demo/demo-quick-actions"
import { Calendar, MessageSquare, FileText, Activity, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DemoHealthMetrics } from "@/components/demo/demo-health-metrics"

// Mock data for demo
const mockProfile = {
  first_name: "Sarah",
  last_name: "Johnson",
  role: "patient" as const,
}

const mockVisits = [
  {
    id: "demo-visit-1",
    patient_id: "demo-patient-1",
    clinician_id: "demo-clinician-1",
    visit_type: "Wound Care",
    scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    status: "scheduled" as const,
    notes: "Regular wound care assessment and dressing change",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    clinician: {
      first_name: "Emily",
      last_name: "Rodriguez",
    },
  },
  {
    id: "demo-visit-2",
    patient_id: "demo-patient-1",
    clinician_id: "demo-clinician-2",
    visit_type: "Physical Therapy",
    scheduled_start: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    status: "scheduled" as const,
    notes: "Mobility exercises and strength training",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    clinician: {
      first_name: "Michael",
      last_name: "Chen",
    },
  },
  {
    id: "demo-visit-3",
    patient_id: "demo-patient-1",
    clinician_id: "demo-clinician-3",
    visit_type: "Medication Management",
    scheduled_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    scheduled_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    status: "scheduled" as const,
    notes: "Review medication schedule and refills",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    clinician: {
      first_name: "Dr. James",
      last_name: "Williams",
    },
  },
]

const mockMessages = [
  {
    id: "demo-msg-1",
    sender_id: "demo-clinician-1",
    recipient_id: "demo-patient-1",
    subject: "Upcoming Visit Reminder",
    body: "Hi Sarah, just a friendly reminder about your wound care visit scheduled for this Thursday at 10:00 AM. Please have your current dressing supplies ready.",
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sender: {
      first_name: "Emily",
      last_name: "Rodriguez",
      role: "clinician" as const,
    },
  },
  {
    id: "demo-msg-2",
    sender_id: "demo-admin-1",
    recipient_id: "demo-patient-1",
    subject: "Lab Results Available",
    body: "Your recent lab results have been uploaded to your documents section. Everything looks good! Your care team will discuss details during your next visit.",
    is_read: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    sender: {
      first_name: "Admin",
      last_name: "Team",
      role: "admin" as const,
    },
  },
  {
    id: "demo-msg-3",
    sender_id: "demo-clinician-2",
    recipient_id: "demo-patient-1",
    subject: "Physical Therapy Progress",
    body: "Great progress in your last session! Keep up with the home exercises we discussed. See you next week!",
    is_read: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sender: {
      first_name: "Michael",
      last_name: "Chen",
      role: "clinician" as const,
    },
  },
]

export default function DemoPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Removed duplicate layout (DemoNav and header) - now handled by layout.tsx */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-card px-4 sm:px-6 py-4 flex items-center justify-between lg:justify-end">
          <div className="w-10 lg:hidden" />
          <div className="flex items-center gap-2">{/* Removed ThemeToggle as it's now handled by layout.tsx */}</div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="min-h-full bg-gradient-to-br from-background via-background to-primary/5 dark:to-primary/10">
            <div className="p-4 md:p-8 space-y-6 md:space-y-8">
              <Alert className="border-primary/50 bg-primary/5">
                <Info className="size-4" />
                <AlertDescription>
                  <strong>Demo Mode:</strong> You&apos;re viewing a demonstration dashboard with sample data. This
                  showcases the patient portal experience for tech recruiters and visitors.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent text-balance">
                  Welcome back, {mockProfile.first_name}
                </h1>
                <p className="text-muted-foreground text-base md:text-lg font-medium">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Upcoming Visits"
                  value={3}
                  icon={Calendar}
                  description="Next 7 days"
                  trend={{ value: 12, isPositive: true }}
                  gradient="from-primary/20 via-primary/10 to-primary/5"
                  href="/demo/visits"
                />
                <StatCard
                  title="Unread Messages"
                  value={2}
                  icon={MessageSquare}
                  description="New communications"
                  trend={{ value: 8, isPositive: false }}
                  gradient="from-accent/20 via-accent/10 to-accent/5"
                  href="/demo/messages"
                />
                <StatCard
                  title="Active Care Plans"
                  value={2}
                  icon={Activity}
                  description="In progress"
                  trend={{ value: 5, isPositive: true }}
                  gradient="from-chart-3/20 via-chart-3/10 to-chart-3/5"
                  href="/demo/care-plans"
                />
                <StatCard
                  title="Documents"
                  value={8}
                  icon={FileText}
                  description="Available records"
                  gradient="from-chart-4/20 via-chart-4/10 to-chart-4/5"
                  href="/demo/documents"
                />
              </div>

              <DemoQuickActions />

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <ActivityChart visits={mockVisits} />
                </div>
                <div className="lg:col-span-1">
                  <DemoHealthMetrics />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <DemoUpcomingVisits visits={mockVisits} />
                <DemoRecentMessages messages={mockMessages} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
