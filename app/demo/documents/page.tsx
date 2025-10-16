"use client"

import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { DocumentsList } from "@/components/documents/documents-list"
import { useToast } from "@/hooks/use-toast"

export default function DemoDocumentsPage() {
  const { toast } = useToast()

  const mockDocuments = [
    {
      id: "1",
      document_type: "discharge_summary",
      file_name: "Hospital_Discharge_Summary_Jan2025.pdf",
      file_url: "#",
      file_size: 245000,
      description: "Discharge summary from recent hospital stay",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      uploader: {
        first_name: "Sarah",
        last_name: "Johnson",
        role: "clinician",
      },
    },
    {
      id: "2",
      document_type: "insurance_card",
      file_name: "Insurance_Card_Front.jpg",
      file_url: "#",
      file_size: 1200000,
      description: "Front of insurance card",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      uploader: {
        first_name: "John",
        last_name: "Doe",
        role: "patient",
      },
    },
    {
      id: "3",
      document_type: "lab_result",
      file_name: "Blood_Work_Results_Dec2024.pdf",
      file_url: "#",
      file_size: 180000,
      description: "Routine blood work results",
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      uploader: {
        first_name: "Sarah",
        last_name: "Johnson",
        role: "clinician",
      },
    },
  ]

  const handleUpload = () => {
    toast({
      title: "Demo Mode",
      description: "This feature is available for authenticated users. Please sign up or log in to upload documents.",
      variant: "default",
    })
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">Access and manage your health documents</p>
        </div>
        <Button onClick={handleUpload}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <DocumentsList documents={mockDocuments} />
    </div>
  )
}
