"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Calendar, MessageSquare, FileText, User, LogOut, Activity, Menu } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface DemoNavProps {
  userName: string
}

export function DemoNav({ userName }: DemoNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleSignOut = () => {
    toast({
      title: "Demo Mode",
      description:
        "This feature is for authenticated users only. Please sign up or log in to access full functionality.",
      variant: "default",
    })
  }

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/demo",
    },
    {
      title: "Visits",
      icon: Calendar,
      href: "/demo/visits",
    },
    {
      title: "Messages",
      icon: MessageSquare,
      href: "/demo/messages",
    },
    {
      title: "Health Records",
      icon: FileText,
      href: "/demo/health-records",
    },
    {
      title: "Care Plans",
      icon: Activity,
      href: "/demo/care-plans",
    },
    {
      title: "Documents",
      icon: FileText,
      href: "/demo/documents",
    },
    {
      title: "Profile",
      icon: User,
      href: "/demo/profile",
    },
  ]

  const NavContent = () => (
    <>
      <div className="border-b border-border/50 p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-foreground">
              MediHealth
            </h2>
            <p className="text-sm text-muted-foreground mt-1 truncate font-medium">{userName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground hover:border hover:border-border/50",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                  isActive && "text-primary",
                )}
              />
              <span className={cn(isActive && "font-semibold")}>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border/50 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </Button>
      </div>
    </>
  )

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 lg:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <NavContent />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:flex h-screen w-64 flex-col border-r bg-card shadow-sm">
        <NavContent />
      </div>
    </>
  )
}
