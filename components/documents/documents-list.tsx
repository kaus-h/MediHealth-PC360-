"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface Document {
  id: string
  document_type: string
  file_name: string
  file_url: string
  file_size?: number
  description?: string
  created_at: string
  uploader?: {
    first_name: string
    last_name: string
    role: string
  }
}

interface DocumentsListProps {
  documents: Document[]
}

export function DocumentsList({ documents }: DocumentsListProps) {
  const { toast } = useToast() // Added toast hook

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size"
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      discharge_summary: "Discharge Summary",
      insurance_card: "Insurance Card",
      order: "Medical Order",
      consent_form: "Consent Form",
      lab_result: "Lab Result",
      other: "Other",
    }
    return labels[type] || type
  }

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      discharge_summary: "bg-blue-100 text-blue-800",
      insurance_card: "bg-green-100 text-green-800",
      order: "bg-purple-100 text-purple-800",
      consent_form: "bg-orange-100 text-orange-800",
      lab_result: "bg-red-100 text-red-800",
      other: "bg-gray-100 text-gray-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const handleDownload = (url: string, fileName: string) => {
    try {
      // Check if it's a demo URL
      if (url === "#") {
        toast({
          title: "Demo Mode",
          description:
            "Document downloads are available for authenticated users. Please sign up or log in to download documents.",
          variant: "default",
        })
        return
      }

      window.open(url, "_blank")
      toast({
        title: "Download Started",
        description: `Downloading ${fileName}`,
        variant: "default",
      })
    } catch (error) {
      console.error("[v0] Error downloading document:", error)
      toast({
        title: "Download Failed",
        description: "Unable to download the document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const documentTypes = ["all", "discharge_summary", "insurance_card", "order", "consent_form", "lab_result", "other"]

  const DocumentCard = ({ document }: { document: Document }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-blue-100 p-3">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold">{document.file_name}</h3>
                <Badge className={getDocumentTypeColor(document.document_type)}>
                  {getDocumentTypeLabel(document.document_type)}
                </Badge>
              </div>
              {document.description && <p className="text-sm text-muted-foreground">{document.description}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(document.created_at)}</span>
              </div>
              {document.uploader && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>
                    {document.uploader.first_name} {document.uploader.last_name}
                  </span>
                </div>
              )}
              <span>{formatFileSize(document.file_size)}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent"
              onClick={() => handleDownload(document.file_url, document.file_name)}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
          <p className="text-sm text-muted-foreground">Your health documents will appear here once uploaded</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="all" className="space-y-6">
      <TabsList className="flex-wrap h-auto">
        {documentTypes.map((type) => {
          const count = type === "all" ? documents.length : documents.filter((d) => d.document_type === type).length
          return (
            <TabsTrigger key={type} value={type}>
              {type === "all" ? "All Documents" : getDocumentTypeLabel(type)} ({count})
            </TabsTrigger>
          )
        })}
      </TabsList>

      {documentTypes.map((type) => {
        const filteredDocs = type === "all" ? documents : documents.filter((d) => d.document_type === type)
        return (
          <TabsContent key={type} value={type} className="space-y-4">
            {filteredDocs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No {getDocumentTypeLabel(type).toLowerCase()}s</h3>
                  <p className="text-sm text-muted-foreground">No documents of this type have been uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredDocs.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
