"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"
import { useToast } from "@/hooks/use-toast"

interface UploadDocumentButtonProps {
  patientIds: string[]
  currentUserId: string
}

export function UploadDocumentButton({ patientIds, currentUserId }: UploadDocumentButtonProps) {
  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState(patientIds[0] || "")
  const [documentType, setDocumentType] = useState<string>("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !documentType || !patientId) return

    setIsLoading(true)
    setError(null)

    try {
      // Upload to Vercel Blob
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      })

      // Save document metadata to database
      const { error: dbError } = await supabase.from("documents").insert({
        patient_id: patientId,
        uploaded_by: currentUserId,
        document_type: documentType,
        file_name: file.name,
        file_url: blob.url,
        file_size: file.size,
        mime_type: file.type,
        description: description.trim() || null,
      })

      if (dbError) throw dbError

      toast({
        title: "Document Uploaded",
        description: `${file.name} has been uploaded successfully.`,
        variant: "default",
      })

      setOpen(false)
      setDocumentType("")
      setDescription("")
      setFile(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error uploading document:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload document"
      setError(errorMessage)
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload a health document securely to your records</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {patientIds.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select value={patientId} onValueChange={setPatientId} disabled={isLoading}>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientIds.map((id) => (
                      <SelectItem key={id} value={id}>
                        Patient {id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType} disabled={isLoading}>
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                  <SelectItem value="insurance_card">Insurance Card</SelectItem>
                  <SelectItem value="order">Medical Order</SelectItem>
                  <SelectItem value="consent_form">Consent Form</SelectItem>
                  <SelectItem value="lab_result">Lab Result</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-xs text-muted-foreground">Max file size: 10MB. Accepted formats: PDF, JPG, PNG, DOC</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isLoading || !file || !documentType}>
              {isLoading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
