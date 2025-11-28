import Link from "next/link"
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen  flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Activity className="h-6 w-6 text-primary" />
            <span>DCRM Monitor</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          
          <div className="container mx-auto flex flex-col items-center text-center gap-8">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
              New: AI-Powered Analysis
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
              Advanced DCRM Waveform <br className="hidden sm:inline" />
              <span className="text-primary">Monitoring & Analysis</span>
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl">
              Ensure the health of your circuit breakers with real-time dynamic contact resistance measurement analysis. Detect faults before they happen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-base gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                View Demo
              </Button>
            </div>
            
            <div className="mt-16 relative rounded-xl border bg-background/50 shadow-2xl backdrop-blur-sm overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-50"></div>
               <img 
                 src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop" 
                 alt="Dashboard Preview" 
                 className="w-full max-w-5xl h-auto rounded-xl opacity-90"
               />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Powerful Features for Engineers</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Everything you need to analyze, track, and report on circuit breaker health.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Real-time Visualization</h3>
                <p className="text-muted-foreground">
                  Visualize DCRM waveforms instantly with high-resolution charts. Zoom, pan, and analyze specific data points.
                </p>
              </div>
              
              <div className="bg-background p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Fault Detection</h3>
                <p className="text-muted-foreground">
                  Our advanced AI algorithms automatically detect anomalies and potential faults in your resistance patterns.
                </p>
              </div>
              
              <div className="bg-background p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Secure Data Storage</h3>
                <p className="text-muted-foreground">
                  All your test data is encrypted and stored securely. Access historical records anytime for trend analysis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto">
            <div className="bg-primary rounded-3xl p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%,rgba(255,255,255,0.1)_100%)] bg-[length:20px_20px] opacity-20"></div>
              
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 relative z-10">Ready to upgrade your monitoring?</h2>
              <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8 relative z-10">
                Join leading power stations using our platform to ensure grid reliability and safety.
              </p>
              <div className="relative z-10">
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold">
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl mb-4">
              <Activity className="h-6 w-6 text-primary" />
              <span>DCRM Monitor</span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              The next generation of circuit breaker analysis tools. Simple, powerful, and intelligent.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Features</Link></li>
              <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="#" className="hover:text-foreground">Case Studies</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">About</Link></li>
              <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          © 2024 DCRM Monitor. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
