"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, FileText, Plus, Video } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DemoQuickActions() {
  const { toast } = useToast()

  const handleDemoClick = () => {
    toast({
      title: "Demo Mode",
      description:
        "This feature is for authenticated users only. Please sign up or log in to access full functionality.",
      variant: "default",
    })
  }

  const actions = [
    {
      label: "Schedule Visit",
      icon: Calendar,
      variant: "default" as const,
    },
    {
      label: "Send Message",
      icon: MessageSquare,
      variant: "outline" as const,
    },
    {
      label: "Upload Document",
      icon: FileText,
      variant: "outline" as const,
    },
    {
      label: "Video Call",
      icon: Video,
      variant: "outline" as const,
    },
  ]

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              className="gap-2 hover:scale-105 transition-transform"
              onClick={handleDemoClick}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
