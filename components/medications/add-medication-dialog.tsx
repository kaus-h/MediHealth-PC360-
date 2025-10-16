"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function AddMedicationDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    instructions: "",
    prescribingPhysician: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    reminderEnabled: true,
  })
  const [reminderTimes, setReminderTimes] = useState<string[]>(["09:00"])
  const { toast } = useToast()
  const router = useRouter()

  const addReminderTime = () => {
    setReminderTimes([...reminderTimes, "09:00"])
  }

  const removeReminderTime = (index: number) => {
    setReminderTimes(reminderTimes.filter((_, i) => i !== index))
  }

  const updateReminderTime = (index: number, value: string) => {
    const newTimes = [...reminderTimes]
    newTimes[index] = value
    setReminderTimes(newTimes)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()

      if (!patient) throw new Error("Patient profile not found")

      const { error } = await supabase.from("medications").insert({
        patient_id: patient.id,
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        instructions: formData.instructions || null,
        prescribing_physician: formData.prescribingPhysician || null,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        reminder_enabled: formData.reminderEnabled,
        reminder_times: reminderTimes,
        created_by: user.id,
      })

      if (error) throw error

      toast({
        title: "Medication Added",
        description: `${formData.name} has been added to your medications`,
      })

      setFormData({
        name: "",
        dosage: "",
        frequency: "",
        instructions: "",
        prescribingPhysician: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        reminderEnabled: true,
      })
      setReminderTimes(["09:00"])
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Medication
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
            <DialogDescription>Add a new medication to track and receive reminders</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Medication Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Lisinopril"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  placeholder="e.g., 10mg"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Input
                  id="frequency"
                  placeholder="e.g., Twice daily"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="e.g., Take with food"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="physician">Prescribing Physician</Label>
              <Input
                id="physician"
                placeholder="Dr. Smith"
                value={formData.prescribingPhysician}
                onChange={(e) => setFormData({ ...formData, prescribingPhysician: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reminders"
                checked={formData.reminderEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, reminderEnabled: checked as boolean })}
              />
              <Label htmlFor="reminders" className="text-sm font-normal">
                Enable medication reminders
              </Label>
            </div>

            {formData.reminderEnabled && (
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>Reminder Times</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addReminderTime}
                    className="gap-1 bg-transparent"
                  >
                    <Plus className="h-3 w-3" />
                    Add Time
                  </Button>
                </div>
                <div className="space-y-2">
                  {reminderTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => updateReminderTime(index, e.target.value)}
                        required
                      />
                      {reminderTimes.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeReminderTime(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Medication"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
