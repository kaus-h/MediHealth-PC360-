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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Star, ThumbsUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface RateVisitDialogProps {
  visitId: string
  clinicianName: string
}

const feedbackOptions = [
  { value: "excellent_care", label: "Excellent Care" },
  { value: "on_time", label: "On Time" },
  { value: "professional", label: "Professional" },
  { value: "clear_communication", label: "Clear Communication" },
  { value: "listened_well", label: "Listened Well" },
  { value: "late_arrival", label: "Late Arrival" },
  { value: "rushed_visit", label: "Rushed Visit" },
  { value: "unclear_instructions", label: "Unclear Instructions" },
  { value: "equipment_issues", label: "Equipment Issues" },
]

export function RateVisitDialog({ visitId, clinicianName }: RateVisitDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ratings, setRatings] = useState({
    overall: 0,
    careQuality: 0,
    communication: 0,
    professionalism: 0,
    timeliness: 0,
  })
  const [feedbackText, setFeedbackText] = useState("")
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const StarRating = ({
    value,
    onChange,
    label,
  }: { value: number; onChange: (val: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (ratings.overall === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).single()

      if (!patient) throw new Error("Patient profile not found")

      // Get clinician ID from visit
      const { data: visit } = await supabase.from("visits").select("clinician_id").eq("id", visitId).single()

      // Insert rating
      const { data: rating, error: ratingError } = await supabase
        .from("visit_ratings")
        .insert({
          visit_id: visitId,
          patient_id: patient.id,
          clinician_id: visit?.clinician_id,
          overall_rating: ratings.overall,
          care_quality_rating: ratings.careQuality || null,
          communication_rating: ratings.communication || null,
          professionalism_rating: ratings.professionalism || null,
          timeliness_rating: ratings.timeliness || null,
          feedback_text: feedbackText.trim() || null,
          would_recommend: wouldRecommend,
          is_anonymous: isAnonymous,
        })
        .select()
        .single()

      if (ratingError) throw ratingError

      // Insert feedback categories
      if (selectedCategories.length > 0 && rating) {
        const categories = selectedCategories.map((category) => ({
          visit_rating_id: rating.id,
          category,
        }))

        const { error: categoriesError } = await supabase.from("visit_feedback_categories").insert(categories)

        if (categoriesError) throw categoriesError
      }

      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted",
      })

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
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Star className="h-4 w-4" />
          Rate Visit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rate Your Visit</DialogTitle>
            <DialogDescription>Share your experience with {clinicianName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <StarRating
              label="Overall Experience *"
              value={ratings.overall}
              onChange={(val) => setRatings({ ...ratings, overall: val })}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <StarRating
                label="Quality of Care"
                value={ratings.careQuality}
                onChange={(val) => setRatings({ ...ratings, careQuality: val })}
              />
              <StarRating
                label="Communication"
                value={ratings.communication}
                onChange={(val) => setRatings({ ...ratings, communication: val })}
              />
              <StarRating
                label="Professionalism"
                value={ratings.professionalism}
                onChange={(val) => setRatings({ ...ratings, professionalism: val })}
              />
              <StarRating
                label="Timeliness"
                value={ratings.timeliness}
                onChange={(val) => setRatings({ ...ratings, timeliness: val })}
              />
            </div>

            <div className="space-y-3">
              <Label>What stood out? (Select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {feedbackOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant={selectedCategories.includes(option.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                placeholder="Tell us more about your experience..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>Would you recommend this clinician?</Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={wouldRecommend === true ? "default" : "outline"}
                  onClick={() => setWouldRecommend(true)}
                  className="flex-1 gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={wouldRecommend === false ? "default" : "outline"}
                  onClick={() => setWouldRecommend(false)}
                  className="flex-1 gap-2"
                >
                  <ThumbsUp className="h-4 w-4 rotate-180" />
                  No
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
              />
              <Label htmlFor="anonymous" className="text-sm font-normal">
                Submit anonymously
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || ratings.overall === 0}>
              {loading ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
