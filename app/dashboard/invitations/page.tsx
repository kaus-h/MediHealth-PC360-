"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Mail, Check, X, Clock, Loader2, UserPlus, Send } from "lucide-react"
import type { Invitation, Profile } from "@/lib/types/database"

interface InvitationWithProfile extends Invitation {
  inviter_profile?: Profile
  invitee_profile?: Profile
}

export default function InvitationsPage() {
  const [receivedInvitations, setReceivedInvitations] = useState<InvitationWithProfile[]>([])
  const [sentInvitations, setSentInvitations] = useState<InvitationWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationWithProfile | null>(null)
  const [actionType, setActionType] = useState<"accept" | "decline" | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single()

      if (!profile) return

      // Load received invitations
      const { data: received, error: receivedError } = await supabase
        .from("invitations")
        .select(
          `
          *,
          inviter_profile:profiles!invitations_inviter_id_fkey(id, first_name, last_name, email, role)
        `,
        )
        .or(`invitee_id.eq.${user.id},invitee_email.eq.${profile.email}`)
        .order("created_at", { ascending: false })

      if (receivedError) {
        console.error("[v0] Error loading received invitations:", receivedError)
        throw receivedError
      }

      // Load sent invitations
      const { data: sent, error: sentError } = await supabase
        .from("invitations")
        .select(
          `
          *,
          invitee_profile:profiles!invitations_invitee_id_fkey(id, first_name, last_name, email, role)
        `,
        )
        .eq("inviter_id", user.id)
        .order("created_at", { ascending: false })

      if (sentError) {
        console.error("[v0] Error loading sent invitations:", sentError)
        throw sentError
      }

      console.log("[v0] Received invitations:", received)
      console.log("[v0] Sent invitations:", sent)

      setReceivedInvitations(received || [])
      setSentInvitations(sent || [])
    } catch (error) {
      console.error("Error loading invitations:", error)
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitation: InvitationWithProfile) => {
    setActionLoading(invitation.id)
    try {
      const supabase = createClient()

      console.log("[v0] Accepting invitation:", invitation)

      const { error } = await supabase
        .from("invitations")
        .update({ status: "accepted", responded_at: new Date().toISOString() })
        .eq("id", invitation.id)

      if (error) {
        console.error("[v0] Error accepting invitation:", error)
        throw error
      }

      toast({
        title: "Invitation accepted",
        description: "You are now connected!",
      })

      await loadInvitations()
    } catch (error) {
      console.error("Error accepting invitation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invitation",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setSelectedInvitation(null)
      setActionType(null)
    }
  }

  const handleDeclineInvitation = async (invitation: InvitationWithProfile) => {
    setActionLoading(invitation.id)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("invitations")
        .update({ status: "declined", responded_at: new Date().toISOString() })
        .eq("id", invitation.id)

      if (error) throw error

      toast({
        title: "Invitation declined",
        description: "The invitation has been declined",
      })

      await loadInvitations()
    } catch (error) {
      console.error("Error declining invitation:", error)
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setSelectedInvitation(null)
      setActionType(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(invitationId)
    try {
      const supabase = createClient()

      const { error } = await supabase.from("invitations").update({ status: "cancelled" }).eq("id", invitationId)

      if (error) throw error

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled",
      })

      await loadInvitations()
    } catch (error) {
      console.error("Error cancelling invitation:", error)
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      accepted: { variant: "default", label: "Accepted" },
      declined: { variant: "destructive", label: "Declined" },
      expired: { variant: "outline", label: "Expired" },
      cancelled: { variant: "outline", label: "Cancelled" },
    }

    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pendingReceived = receivedInvitations.filter((inv) => inv.status === "pending")
  const pendingSent = sentInvitations.filter((inv) => inv.status === "pending")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invitations</h1>
        <p className="text-muted-foreground">Manage your connection invitations</p>
      </div>

      <Tabs defaultValue="received" className="space-y-4">
        <TabsList>
          <TabsTrigger value="received" className="gap-2">
            <Mail className="h-4 w-4" />
            Received
            {pendingReceived.length > 0 && (
              <Badge variant="default" className="ml-1">
                {pendingReceived.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Sent
            {pendingSent.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingSent.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Received Invitations</CardTitle>
              <CardDescription>Invitations you have received from others</CardDescription>
            </CardHeader>
            <CardContent>
              {receivedInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No invitations</h3>
                  <p className="text-muted-foreground">You haven't received any invitations yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserPlus className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">
                              {invitation.inviter_profile
                                ? `${invitation.inviter_profile.first_name} ${invitation.inviter_profile.last_name}`
                                : "Unknown User"}
                            </h4>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invitation.invitation_type === "patient_to_clinician"
                              ? "Wants to add you as their clinician"
                              : "Wants to add you as their patient"}
                          </p>
                          {invitation.message && (
                            <p className="text-sm text-muted-foreground mt-1 italic">"{invitation.message}"</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">Sent {formatDate(invitation.created_at)}</p>
                        </div>
                      </div>
                      {invitation.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInvitation(invitation)
                              setActionType("accept")
                            }}
                            disabled={actionLoading === invitation.id}
                            className="gap-2"
                          >
                            {actionLoading === invitation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvitation(invitation)
                              setActionType("decline")
                            }}
                            disabled={actionLoading === invitation.id}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sent Invitations</CardTitle>
              <CardDescription>Invitations you have sent to others</CardDescription>
            </CardHeader>
            <CardContent>
              {sentInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sent invitations</h3>
                  <p className="text-muted-foreground">You haven't sent any invitations yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{invitation.invitee_email}</h4>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invitation.invitation_type === "patient_to_clinician"
                              ? "Invited to be your clinician"
                              : "Invited to be your patient"}
                          </p>
                          {invitation.message && (
                            <p className="text-sm text-muted-foreground mt-1 italic">"{invitation.message}"</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">Sent {formatDate(invitation.created_at)}</p>
                        </div>
                      </div>
                      {invitation.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          className="gap-2"
                        >
                          {actionLoading === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!selectedInvitation && !!actionType}
        onOpenChange={() => {
          setSelectedInvitation(null)
          setActionType(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "accept" ? "Accept Invitation?" : "Decline Invitation?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "accept"
                ? "This will create a connection between you and the inviter. You'll be able to message each other and share information."
                : "This will decline the invitation. The inviter will be notified."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedInvitation) {
                  if (actionType === "accept") {
                    handleAcceptInvitation(selectedInvitation)
                  } else {
                    handleDeclineInvitation(selectedInvitation)
                  }
                }
              }}
            >
              {actionType === "accept" ? "Accept" : "Decline"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
