"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Users, Stethoscope, Package, Plus, Search } from "lucide-react"
import { MessageTemplateDialog } from "@/components/clinician/message-template-dialog"
import { NewMessageDialog } from "@/components/clinician/new-message-dialog"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  subject?: string
  body: string
  is_read: boolean
  created_at: string
  sender?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
  recipient?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
}

interface PhysicianMessage {
  id: string
  subject?: string
  message: string
  priority: string
  is_read: boolean
  created_at: string
  physician?: {
    profile: {
      first_name: string
      last_name: string
    }
  }
  patient?: {
    profile: {
      first_name: string
      last_name: string
    }
  }
}

interface VendorUpdate {
  id: string
  equipment_type: string
  status: string
  tracking_number?: string
  estimated_delivery_date?: string
  updated_at: string
  vendor?: {
    company_name: string
  }
  medical_order?: {
    patient?: {
      profile: {
        first_name: string
        last_name: string
      }
    }
  }
}

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface CommunicationCenterProps {
  receivedMessages: Message[]
  sentMessages: Message[]
  physicianMessages: PhysicianMessage[]
  vendorUpdates: VendorUpdate[]
  patients: Patient[]
  currentUserId: string
}

export function CommunicationCenter({
  receivedMessages,
  sentMessages,
  physicianMessages,
  vendorUpdates,
  patients,
  currentUserId,
}: CommunicationCenterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const unreadCount = receivedMessages.filter((m) => !m.is_read).length
  const unreadPhysicianCount = physicianMessages.filter((m) => !m.is_read).length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      in_transit: "bg-blue-100 text-blue-800 border-blue-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      normal: "bg-blue-100 text-blue-800 border-blue-200",
      low: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[priority] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Communication Center</h1>
          <p className="text-muted-foreground mt-1">Manage all your patient and team communications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowNewMessage(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inbox" className="relative">
            <MessageSquare className="h-4 w-4 mr-2" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Users className="h-4 w-4 mr-2" />
            Sent
          </TabsTrigger>
          <TabsTrigger value="physicians" className="relative">
            <Stethoscope className="h-4 w-4 mr-2" />
            Physicians
            {unreadPhysicianCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {unreadPhysicianCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vendors">
            <Package className="h-4 w-4 mr-2" />
            Vendors
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Received Messages</CardTitle>
              <CardDescription>
                {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receivedMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No messages</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedMessages
                    .filter(
                      (msg) =>
                        !searchTerm ||
                        msg.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        `${msg.sender?.first_name} ${msg.sender?.last_name}`
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                    )
                    .map((message) => (
                      <div
                        key={message.id}
                        className={`border rounded-lg p-4 hover:shadow-sm transition-all cursor-pointer ${
                          !message.is_read ? "bg-primary/5 border-primary/30" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {!message.is_read && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                              <p className="font-semibold">
                                {message.sender?.first_name} {message.sender?.last_name}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {message.sender?.role}
                              </Badge>
                            </div>
                            {message.subject && <p className="font-medium text-sm">{message.subject}</p>}
                            <p className="text-sm text-muted-foreground line-clamp-2">{message.body}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent Tab */}
        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sent Messages</CardTitle>
              <CardDescription>{sentMessages.length} messages sent</CardDescription>
            </CardHeader>
            <CardContent>
              {sentMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No sent messages</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentMessages
                    .filter(
                      (msg) =>
                        !searchTerm ||
                        msg.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        `${msg.recipient?.first_name} ${msg.recipient?.last_name}`
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                    )
                    .map((message) => (
                      <div key={message.id} className="border rounded-lg p-4 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">
                                To: {message.recipient?.first_name} {message.recipient?.last_name}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {message.recipient?.role}
                              </Badge>
                            </div>
                            {message.subject && <p className="font-medium text-sm">{message.subject}</p>}
                            <p className="text-sm text-muted-foreground line-clamp-2">{message.body}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Physicians Tab */}
        <TabsContent value="physicians" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Physician Communications</CardTitle>
              <CardDescription>Messages from referring physicians</CardDescription>
            </CardHeader>
            <CardContent>
              {physicianMessages.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No physician messages</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {physicianMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`border rounded-lg p-4 hover:shadow-sm transition-all ${
                        !message.is_read ? "bg-primary/5 border-primary/30" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!message.is_read && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                            <p className="font-semibold">
                              Dr. {message.physician?.profile.first_name} {message.physician?.profile.last_name}
                            </p>
                            <Badge variant="outline" className={getPriorityColor(message.priority)}>
                              {message.priority}
                            </Badge>
                          </div>
                          {message.patient && (
                            <p className="text-xs text-muted-foreground">
                              Re: {message.patient.profile.first_name} {message.patient.profile.last_name}
                            </p>
                          )}
                          {message.subject && <p className="font-medium text-sm">{message.subject}</p>}
                          <p className="text-sm text-muted-foreground">{message.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Updates</CardTitle>
              <CardDescription>DME orders and delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              {vendorUpdates.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No vendor updates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vendorUpdates.map((update) => (
                    <div key={update.id} className="border rounded-lg p-4 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{update.vendor?.company_name}</p>
                            <Badge variant="outline" className={getStatusColor(update.status)}>
                              {update.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          {update.medical_order?.patient && (
                            <p className="text-xs text-muted-foreground">
                              Patient: {update.medical_order.patient.profile.first_name}{" "}
                              {update.medical_order.patient.profile.last_name}
                            </p>
                          )}
                          <p className="text-sm">{update.equipment_type}</p>
                          {update.tracking_number && (
                            <p className="text-xs text-muted-foreground">Tracking: {update.tracking_number}</p>
                          )}
                          {update.estimated_delivery_date && (
                            <p className="text-xs text-muted-foreground">
                              Est. Delivery: {new Date(update.estimated_delivery_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(update.updated_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MessageTemplateDialog open={showTemplates} onOpenChange={setShowTemplates} />
      <NewMessageDialog
        open={showNewMessage}
        onOpenChange={setShowNewMessage}
        patients={patients}
        currentUserId={currentUserId}
      />
    </div>
  )
}
