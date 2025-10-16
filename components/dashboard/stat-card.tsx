import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  gradient?: string
  href?: string
}

export function StatCard({ title, value, icon: Icon, description, trend, gradient, href }: StatCardProps) {
  const content = (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 backdrop-blur-sm",
        href && "cursor-pointer",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-80",
          gradient || "from-primary/20 via-primary/10 to-primary/5",
        )}
      />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl md:text-5xl font-serif font-bold text-foreground tabular-nums">{value}</p>
              {trend && (
                <span
                  className={cn(
                    "text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-full",
                    trend.isPositive ? "text-chart-4 bg-chart-4/15" : "text-destructive bg-destructive/15",
                  )}
                >
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>}
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 p-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
            <Icon className="h-7 w-7 text-primary" strokeWidth={2.5} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
