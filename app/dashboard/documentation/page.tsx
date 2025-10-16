"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Save, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Patient {
  id: string
  full_name: string
}

interface Visit {
  id: string
  patient_id: string
  visit_type: string
  scheduled_date: string
  status: string
  notes: string
  patients: Patient
}

export default function DocumentationPage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [selectedVisit, setSelectedVisit] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchVisits()
  }, [])

  async function fetchVisits() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("visits")
      .select(`
        *,
        patients (
          id,
          full_name
        )
      `)
      .eq("clinician_id", user.id)
      .in("status", ["scheduled", "in-progress", "completed"])
      .order("scheduled_date", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching visits:", error)
    } else {
      setVisits(data || [])
    }
    setLoading(false)
  }

  async function handleSaveNotes() {
    if (!selectedVisit || !notes.trim()) {
      toast({
        title: "Error",
        description: "Please select a visit and enter notes",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from("visits")
      .update({
        notes,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedVisit)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save documentation",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Visit documentation saved successfully",
      })
      setNotes("")
      setSelectedVisit("")
      fetchVisits()
    }

    setSaving(false)
  }

  const selectedVisitData = visits.find((v) => v.id === selectedVisit)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-muted-foreground">Loading visits...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-3xl tracking-tight text-foreground">Visit Documentation</h1>
        <p className="text-muted-foreground">Document patient visits and update care notes</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Document Visit</CardTitle>
            <CardDescription>Select a visit and add your clinical notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visit">Select Visit</Label>
              <Select
                value={selectedVisit}
                onValueChange={(value) => {
                  setSelectedVisit(value)
                  const visit = visits.find((v) => v.id === value)
                  setNotes(visit?.notes || "")
                }}
              >
                <SelectTrigger id="visit">
                  <SelectValue placeholder="Choose a visit to document" />
                </SelectTrigger>
                <SelectContent>
                  {visits.map((visit) => (
                    <SelectItem key={visit.id} value={visit.id}>
                      {visit.patients.full_name} - {visit.visit_type} -{" "}
                      {new Date(visit.scheduled_date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedVisitData && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Patient</p>
                    <p className="text-sm text-muted-foreground">{selectedVisitData.patients.full_name}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Visit Type</p>
                    <p className="text-sm text-muted-foreground">{selectedVisitData.visit_type}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedVisitData.scheduled_date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant={selectedVisitData.status === "completed" ? "default" : "secondary"}>
                      {selectedVisitData.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Clinical Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter visit notes, observations, and care provided..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={12}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Document patient condition, interventions performed, and any follow-up needed
              </p>
            </div>

            <Button
              onClick={handleSaveNotes}
              disabled={saving || !selectedVisit}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Save className="size-4 mr-2" />
              {saving ? "Saving..." : "Save Documentation"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg">Recent Visits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {visits.slice(0, 5).map((visit) => (
                <div key={visit.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <FileText className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{visit.patients.full_name}</p>
                    <p className="text-xs text-muted-foreground">{visit.visit_type}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="size-3" />
                      {new Date(visit.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={visit.status === "completed" ? "default" : "secondary"} className="shrink-0">
                    {visit.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentation Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Be specific and objective in your observations</p>
              <p>• Document all interventions and patient responses</p>
              <p>• Note any changes in patient condition</p>
              <p>• Include patient/family education provided</p>
              <p>• Record follow-up plans and next steps</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
