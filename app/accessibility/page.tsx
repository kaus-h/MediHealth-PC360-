import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Keyboard, Eye, Volume2, Shield, FileText } from "lucide-react"

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <nav aria-label="Primary navigation" className="flex items-center justify-between">
            <Link href="/" className="font-bold text-2xl text-primary">
              MediHealth
            </Link>
            <Button asChild variant="outline">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="font-bold text-4xl mb-4 text-balance">Accessibility Statement</h1>
            <p className="text-lg text-muted-foreground text-pretty">
              MediHealth is committed to ensuring digital accessibility for people with disabilities. We are continually
              improving the user experience for everyone and applying the relevant accessibility standards.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="size-6 text-primary" aria-hidden="true" />
                Our Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. These
                guidelines explain how to make web content more accessible for people with disabilities and
                user-friendly for everyone.
              </p>
              <p>
                As a healthcare platform handling Protected Health Information (PHI), we also maintain strict HIPAA
                compliance while ensuring our platform remains accessible to all users.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Keyboard className="size-5 text-primary" aria-hidden="true" />
                  Keyboard Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• All features accessible via keyboard</li>
                  <li>• Skip to main content link</li>
                  <li>• Logical tab order</li>
                  <li>• Visible focus indicators</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Eye className="size-5 text-primary" aria-hidden="true" />
                  Visual Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• High contrast color schemes</li>
                  <li>• Resizable text up to 200%</li>
                  <li>• Clear visual hierarchy</li>
                  <li>• No color-only information</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Volume2 className="size-5 text-primary" aria-hidden="true" />
                  Screen Readers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Semantic HTML structure</li>
                  <li>• ARIA labels and landmarks</li>
                  <li>• Descriptive link text</li>
                  <li>• Alt text for images</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <FileText className="size-5 text-primary" aria-hidden="true" />
                  Content & Forms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Clear form labels</li>
                  <li>• Helpful error messages</li>
                  <li>• Plain language content</li>
                  <li>• Consistent navigation</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assistive Technologies</CardTitle>
              <CardDescription>MediHealth is tested with the following assistive technologies:</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 md:grid-cols-2 text-sm">
                <li>• JAWS (Job Access With Speech)</li>
                <li>• NVDA (NonVisual Desktop Access)</li>
                <li>• VoiceOver (macOS and iOS)</li>
                <li>• TalkBack (Android)</li>
                <li>• Dragon NaturallySpeaking</li>
                <li>• ZoomText</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We welcome your feedback on the accessibility of MediHealth. If you encounter any accessibility barriers
                or have suggestions for improvement, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Email:</strong> accessibility@medihealth.com
                </p>
                <p>
                  <strong>Phone:</strong> 1-800-PATIENT (1-800-728-4368)
                </p>
                <p>
                  <strong>Response Time:</strong> We aim to respond to accessibility feedback within 2 business days.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ongoing Efforts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Accessibility is an ongoing effort. We regularly review and improve our platform through:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Quarterly accessibility audits</li>
                <li>• User testing with people with disabilities</li>
                <li>• Staff training on accessibility best practices</li>
                <li>• Automated and manual testing</li>
                <li>• Regular updates based on user feedback</li>
              </ul>
            </CardContent>
          </Card>

          <div className="text-center pt-8">
            <p className="text-sm text-muted-foreground mb-4">Last updated: January 2025</p>
            <Button asChild size="lg">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
