"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, FileText, Plus, Video } from "lucide-react"
import Link from "next/link"

interface QuickActionsProps {
  role: string
}

export function QuickActions({ role }: QuickActionsProps) {
  const actions = [
    {
      label: "Schedule Visit",
      icon: Calendar,
      href: "/dashboard/visits",
      variant: "default" as const,
    },
    {
      label: "Send Message",
      icon: MessageSquare,
      href: "/dashboard/messages",
      variant: "outline" as const,
    },
    {
      label: "Upload Document",
      icon: FileText,
      href: "/dashboard/documents",
      variant: "outline" as const,
    },
    {
      label: "Video Call",
      icon: Video,
      href: "/dashboard/video",
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
              asChild
              variant={action.variant}
              size="sm"
              className="gap-2 hover:scale-105 transition-transform"
            >
              <Link href={action.href}>
                <action.icon className="h-4 w-4" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
