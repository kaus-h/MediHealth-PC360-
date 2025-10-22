"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MessageTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MessageTemplateDialog({ open, onOpenChange }: MessageTemplateDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()

  const templates = [
    {
      id: "visit-reminder",
      title: "Visit Reminder",
      category: "Scheduling",
      content:
        "Hi [Patient Name], this is a reminder about your upcoming visit on [Date] at [Time]. Please ensure someone is home to receive me. If you need to reschedule, please let me know as soon as possible. Looking forward to seeing you!",
    },
    {
      id: "visit-complete",
      title: "Visit Completed",
      category: "Follow-up",
      content:
        "Hi [Patient Name], thank you for allowing me to visit today. I've completed your [Visit Type] and documented everything in your chart. Please remember to [Instructions]. If you have any questions or concerns, don't hesitate to reach out.",
    },
    {
      id: "medication-reminder",
      title: "Medication Reminder",
      category: "Care Management",
      content:
        "Hi [Patient Name], this is a reminder to take your [Medication Name] as prescribed. If you're experiencing any side effects or have questions about your medication, please contact me or your physician immediately.",
    },
    {
      id: "lab-results",
      title: "Lab Results Follow-up",
      category: "Clinical",
      content:
        "Hi [Patient Name], I wanted to follow up regarding your recent lab results. [Brief Summary]. Your physician has been notified and may adjust your care plan accordingly. Please let me know if you have any questions.",
    },
    {
      id: "equipment-delivery",
      title: "Equipment Delivery Notice",
      category: "DME",
      content:
        "Hi [Patient Name], your [Equipment Type] is scheduled for delivery on [Date]. Please ensure someone is home to receive and sign for the equipment. The vendor will provide setup instructions. Contact me if you need assistance.",
    },
    {
      id: "care-plan-update",
      title: "Care Plan Update",
      category: "Care Management",
      content:
        "Hi [Patient Name], I've updated your care plan based on your recent progress. Your new goals include: [Goals]. We'll work together to achieve these during our upcoming visits. Great job on your progress so far!",
    },
    {
      id: "physician-consult",
      title: "Physician Consultation Request",
      category: "Clinical",
      content:
        "Dr. [Physician Name], I'm writing regarding our mutual patient [Patient Name]. I've observed [Observations/Concerns] during recent visits. Current vitals: [Vitals]. Please advise on any changes to the care plan or if you'd like me to schedule additional monitoring.",
    },
    {
      id: "missed-visit",
      title: "Missed Visit Follow-up",
      category: "Scheduling",
      content:
        "Hi [Patient Name], I noticed you weren't available for our scheduled visit today at [Time]. I hope everything is okay. Please contact me to reschedule at your earliest convenience. Your health and care continuity are important to us.",
    },
  ]

  const handleCopy = (template: (typeof templates)[0]) => {
    navigator.clipboard.writeText(template.content)
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: "Template Copied",
      description: "The message template has been copied to your clipboard",
    })
  }

  const categories = [...new Set(templates.map((t) => t.category))]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Message Templates</DialogTitle>
          <DialogDescription>Quick templates for common communications</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-lg">{category}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {templates
                  .filter((t) => t.category === category)
                  .map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{template.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{template.content}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() => handleCopy(template)}
                        >
                          {copiedId === template.id ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Template
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
