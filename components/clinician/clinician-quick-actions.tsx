import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, FileText, UserPlus, ClipboardList, Phone } from "lucide-react"
import Link from "next/link"

export function ClinicianQuickActions() {
  const actions = [
    {
      title: "Schedule Visit",
      description: "Add new patient visit",
      icon: Calendar,
      href: "/dashboard/visits?action=schedule",
      gradient: "from-primary/20 to-primary/5",
    },
    {
      title: "Send Message",
      description: "Contact patient or team",
      icon: MessageSquare,
      href: "/dashboard/messages?action=new",
      gradient: "from-accent/20 to-accent/5",
    },
    {
      title: "Document Visit",
      description: "Complete visit notes",
      icon: FileText,
      href: "/dashboard/documentation",
      gradient: "from-chart-3/20 to-chart-3/5",
    },
    {
      title: "Invite Patient",
      description: "Add to caseload",
      icon: UserPlus,
      href: "/dashboard/invitations?action=invite",
      gradient: "from-chart-4/20 to-chart-4/5",
    },
    {
      title: "Care Plans",
      description: "Review and update",
      icon: ClipboardList,
      href: "/dashboard/care-plans",
      gradient: "from-chart-2/20 to-chart-2/5",
    },
    {
      title: "Emergency Contact",
      description: "Quick access",
      icon: Phone,
      href: "/dashboard/emergency-contacts",
      gradient: "from-destructive/20 to-destructive/5",
    },
  ]

  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.title}
                asChild
                variant="outline"
                className="h-auto flex-col gap-2 p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-br hover:border-primary/30"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                }}
              >
                <Link href={action.href}>
                  <div className="rounded-full bg-background p-2 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-xs">{action.title}</p>
                    <p className="text-[10px] text-muted-foreground">{action.description}</p>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
