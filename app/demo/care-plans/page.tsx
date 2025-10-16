"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Calendar } from "lucide-react"

export default function DemoCarePlansPage() {
  const mockCarePlan = {
    title: "Post-Discharge Care Plan",
    startDate: "January 15, 2025",
    goals: [
      {
        title: "Improve Mobility",
        status: "in_progress",
        tasks: [
          { title: "Complete daily walking exercises", completed: true },
          { title: "Attend physical therapy sessions", completed: true },
          { title: "Practice balance exercises", completed: false },
        ],
      },
      {
        title: "Medication Management",
        status: "on_track",
        tasks: [
          { title: "Take medications as prescribed", completed: true },
          { title: "Monitor blood pressure daily", completed: true },
          { title: "Track blood glucose levels", completed: true },
        ],
      },
      {
        title: "Wound Care",
        status: "completed",
        tasks: [
          { title: "Daily dressing changes", completed: true },
          { title: "Monitor for signs of infection", completed: true },
          { title: "Follow-up with surgeon", completed: true },
        ],
      },
    ],
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      on_track: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      at_risk: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: "Completed",
      on_track: "On Track",
      in_progress: "In Progress",
      at_risk: "At Risk",
    }
    return labels[status] || status
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Care Plans</h1>
        <p className="text-muted-foreground mt-1">Track your recovery goals and progress</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{mockCarePlan.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Started {mockCarePlan.startDate}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {mockCarePlan.goals.map((goal, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl">{goal.title}</CardTitle>
                <Badge className={getStatusColor(goal.status)}>{getStatusLabel(goal.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {goal.tasks.map((task, taskIndex) => (
                  <div
                    key={taskIndex}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={task.completed ? "text-muted-foreground line-through" : ""}>{task.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
