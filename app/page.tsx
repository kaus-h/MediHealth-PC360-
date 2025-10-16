import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Calendar, MessageSquare, FileText, Bell, Shield, Users, ArrowRight, CheckCircle2, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <nav aria-label="Primary navigation" className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/images/medihealth-icon.png"
                alt="MediHealth"
                width={32}
                height={32}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <span className="text-xl sm:text-2xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-violet-300">
                MediHealth
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <Button asChild variant="ghost" className="hover:bg-accent/10">
                <Link href="/demo">Guest Demo</Link>
              </Button>
              <Button asChild variant="ghost" className="hover:bg-primary/10">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/demo">Guest Demo</Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                      <Link href="/auth/sign-up">Get Started</Link>
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section with Image */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5"
        >
          <div className="container relative mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              {/* Left: Text Content */}
              <div className="space-y-6 sm:space-y-8">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  <span className="text-xs sm:text-sm font-semibold text-primary">HIPAA Compliant & Secure</span>
                </div>

                <h1
                  id="hero-heading"
                  className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-foreground leading-tight text-balance"
                >
                  Modern Home Health Care{" "}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-foreground">
                    Management
                  </span>
                </h1>

                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed text-pretty max-w-xl">
                  The first MyChart-style patient portal purpose-built for home health care. Stay connected with your
                  care team, manage visits, and access your health information—all in one place.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="text-base sm:text-lg px-6 sm:px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 group w-full sm:w-auto"
                  >
                    <Link href="/auth/sign-up">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="text-base sm:text-lg px-6 sm:px-8 border-2 hover:bg-accent/10 hover:border-accent bg-transparent w-full sm:w-auto"
                  >
                    <Link href="/demo">Try Demo</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">HIPAA Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-lime-700" />
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Easy access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-chart-3" />
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">99.9% Uptime</span>
                  </div>
                </div>
              </div>

              {/* Right: Hero Image */}
              <div className="relative hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-border/50">
                  <Image
                    src="/images/medical-tech-banner.jpg"
                    alt="Modern healthcare technology with digital health monitoring"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                </div>
                {/* Floating stat cards */}
                <div className="absolute -bottom-6 -left-6 bg-card border-2 border-border/50 rounded-xl p-4 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Calendar className="h-6 w-6 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">Visit Scheduling</p>
                      <p className="text-sm text-muted-foreground">Export to calendar</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Images */}
        <section aria-labelledby="features-heading" className="container mx-auto px-6 py-20 lg:py-32">
          <div className="text-center mb-16 space-y-4">
            <h2 id="features-heading" className="font-serif font-bold text-4xl lg:text-5xl text-foreground">
              Everything You Need for Better Care
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Comprehensive tools designed specifically for home health patients and their families
            </p>
          </div>

          {/* Feature Grid with Images */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Feature 1: Patient-Centered Care */}
            <Card className="border-2 border-border/50 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 overflow-hidden group">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src="/images/patient-doctor-chat.jpg"
                  alt="Healthcare provider consulting with patient"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/85 via-card/50 to-transparent" />
              </div>
              <CardContent className="pt-6 pb-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl text-input bg-input">
                    <Users className="h-6 w-6 text-lime-700" />
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-foreground">Patient-Centered Care</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Build meaningful connections with your care team through secure messaging, video calls, and real-time
                  visit updates. Your health journey, supported every step of the way.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="">24/7 secure messaging with care team</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Real-time visit notifications</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Family caregiver access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2: Comprehensive Health Records */}
            <Card className="border-2 border-border/50 hover:border-accent/50 hover:shadow-2xl transition-all duration-300 overflow-hidden group">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src="/images/doctor-family-care.jpg"
                  alt="Healthcare protection and family care"
                  width={600}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/85 via-card/50 to-transparent" />
              </div>
              <CardContent className="pt-6 pb-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-input">
                    <Shield className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-foreground">Protected Health Records</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Access your complete health history, care plans, medications, and visit notes—all protected with
                  enterprise-grade security and HIPAA compliance.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Complete medical history access</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Medication tracking & reminders</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Secure document storage</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl shrink-0 bg-input">
                    <Calendar className="size-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Smart Scheduling</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      View upcoming visits, receive real-time updates, and get notified when your clinician is on the
                      way.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl shrink-0 bg-input">
                    <MessageSquare className="size-6 text-fuchsia-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Secure Messaging</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      HIPAA-compliant messaging with your care team. Ask questions and get answers quickly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl shrink-0 bg-input">
                    <FileText className="size-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Digital Records</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Access your care plans, visit notes, medications, and important documents anytime, anywhere.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl shrink-0 bg-input">
                    <Bell className="size-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Smart Notifications</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Get timely reminders for visits, medications, and therapy exercises without overwhelming alerts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl shrink-0 bg-input">
                    <Shield className="size-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Enterprise Security</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your health information is protected with enterprise-grade security and full HIPAA compliance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl shrink-0 bg-input">
                    <Users className="size-6 text-lime-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Family Access</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Grant secure access to family caregivers and MPOAs with customizable permissions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section with Background Image */}
        <section aria-labelledby="cta-heading" className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0">
            <Image src="/images/doctor-reaches-shelf.jpg" alt="Healthcare professional" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/80 via-purple-400/75 to-accent/85" />
          </div>

          <div className="container relative mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center space-y-8 text-primary-foreground">
              <h2 id="cta-heading" className="font-serif font-bold text-4xl lg:text-5xl text-balance">
                Ready to take control of your home health care?
              </h2>
              <p className="text-lg lg:text-xl opacity-95 leading-relaxed">
                Join thousands of patients and families using MediHealth to stay connected with their care teams
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  asChild
                  size="lg"
                  className="text-lg px-8 bg-background text-primary hover:bg-background/90 shadow-2xl"
                >
                  <Link href="/auth/sign-up">Create Your Account</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
                >
                  <Link href="/demo">Try Demo First</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/images/medihealth-icon.png"
                    alt="MediHealth"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                  <h3 className="font-serif font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-foreground">
                    MediHealth
                  </h3>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Modern home health care management platform. HIPAA compliant and secure.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="text-muted-foreground hover:text-primary transition-colors">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/accessibility" className="text-muted-foreground hover:text-primary transition-colors">
                    Accessibility
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8">
            <p className="text-sm text-muted-foreground text-center">
              © 2025 MediHealth. HIPAA Compliant Healthcare Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
