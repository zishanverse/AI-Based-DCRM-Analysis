"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BentoGrid from "@/components/bento-grid";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Brain,
  TrendingUp,
  ArrowRight,
  Play,
  BarChart3,
  Cpu,
  Radio,
  Users,
  Award,
  CheckCircle,
  Sparkles,
  ChevronDown,
  Activity,
  Gauge,
  Zap,
  Server,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function PowergridLandingPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const carouselImages = [
    {
      src: "https://cpimg.tistatic.com/08718005/b/4/Loco-Vaccum-Circuit-Breaker-Test-System.jpg",
      title: "National Grid Monitor",
      description: "Real-time telemetry from EHV substations across India",
    },
    {
      src: "https://img.etimg.com/thumb/width-1600,height-900,imgsize-108722,resizemode-75,msid-117899457/markets/stocks/news/power-grid-shares-in-focus-after-co-posts-4-yoy-drop-in-q3-profit-declares-rs-3-25/sh-dividend.jpg",
      title: "Circuit Breaker Analytics",
      description: "DCRM signature analysis for predictive maintenance",
    },
    {
      src: "https://th.bing.com/th/id/OIP.haLjZCPRyUyLZsNQ__8tZwHaEK?w=316&h=180&c=7&r=0&o=7&dpr=2&pid=1.7&rm=3",
      title: "Command Center",
      description: "Centralized AI-driven fault detection dashboard",
    },
  ];

  const features = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: "AI Analysis",
      description: "Auto-fault detection",
      color: "text-blue-600 bg-blue-50",
    },
    {
      icon: <Activity className="w-5 h-5" />,
      title: "Live DCRM",
      description: "Real-time breaker signatures",
      color: "text-orange-600 bg-orange-50",
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Grid Security",
      description: "ISO 27001 Certified",
      color: "text-green-600 bg-green-50",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Predictive",
      description: "Failure forecasting",
      color: "text-purple-600 bg-purple-50",
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime", icon: <Activity className="w-4 h-4" /> },
    {
      value: "500+",
      label: "Substations",
      icon: <Server className="w-4 h-4" />,
    },
    { value: "24/7", label: "Monitoring", icon: <Globe className="w-4 h-4" /> },
    { value: "ISO", label: "Certified", icon: <Award className="w-4 h-4" /> },
  ];

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      {/* Dense Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#003366] text-white shadow-md border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Placeholder */}
            <div className="bg-white p-1 rounded-sm">
              <Zap className="w-5 h-5 text-[#003366]" />
            </div>
            <span className="font-bold text-sm sm:text-base tracking-wide uppercase">
              Powergrid DCRM Portal
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-blue-100">
            <span className="hidden sm:inline-block">Ministry of Power</span>
            <span className="h-4 w-px bg-blue-400/30 hidden sm:block"></span>
            <span className="hidden sm:inline-block">Government of India</span>
            <Button
              variant="ghost"
              className="text-white hover:bg-blue-800 hover:text-white h-8 px-3 text-xs uppercase tracking-wider"
              onClick={() => router.push("/sign-in")}
            >
              Login
            </Button>
          </div>
        </div>
      </nav>

      {/* Primary Hero Section - High Density */}
      <section
        ref={heroRef}
        className="relative pt-20 pb-12 bg-white overflow-hidden"
      >
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-slate-100 to-transparent skew-x-12 opacity-50 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Content: Information Dense */}
            <div className="lg:col-span-7 space-y-6 pt-4">
              {/* Badge Area */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
              >
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200 px-2 py-0.5 text-xs uppercase tracking-wider font-semibold"
                >
                  <Activity className="w-3 h-3 mr-1" /> Live Monitor
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-xs uppercase tracking-wider font-semibold"
                >
                  v2.4 Stable
                </Badge>
              </motion.div>

              {/* Main Headlines */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-4xl lg:text-5xl font-extrabold text-[#003366] leading-tight tracking-tight mb-3">
                  National <span className="text-orange-600">Smart Grid</span>{" "}
                  <br />
                  Diagnostics System
                </h1>
                <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                  Next-generation{" "}
                  <span className="font-semibold text-slate-900">
                    DCRM Analysis
                  </span>{" "}
                  for EHV Circuit Breakers. Minimizing downtime through
                  AI-driven predictive maintenance and real-time fault
                  isolation.
                </p>
              </motion.div>

              {/* Feature Grid - Integrated in Hero for Density */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-3 max-w-xl mt-4"
              >
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className={cn("p-2 rounded-md shrink-0", f.color)}>
                      {f.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {f.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-tight mt-0.5">
                        {f.description}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-3 pt-4"
              >
                <Button
                  size="lg"
                  className="bg-[#003366] hover:bg-blue-900 text-white rounded-md px-6 shadow-lg shadow-blue-900/20"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Access Dashboard
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md px-6"
                >
                  View Documentation
                </Button>
              </motion.div>
            </div>

            {/* Right Content: Compact Visuals */}
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
              >
                {/* Visual Container styled as a control panel */}
                <div className="bg-slate-900 p-2 rounded-xl shadow-2xl ring-1 ring-slate-900/50">
                  <Carousel
                    className="w-full"
                    opts={{ loop: true }}
                    setApi={(api) => {
                      if (api)
                        api.on("select", () =>
                          setActiveIndex(api.selectedScrollSnap())
                        );
                    }}
                  >
                    <CarouselContent>
                      {carouselImages.map((img, idx) => (
                        <CarouselItem key={idx}>
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-700 group">
                            <img
                              src={img.src}
                              alt={img.title}
                              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-[#003366]/90 via-transparent to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <div className="inline-flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">
                                  System Active
                                </span>
                              </div>
                              <h3 className="text-white font-bold text-lg leading-none">
                                {img.title}
                              </h3>
                              <p className="text-slate-300 text-xs mt-1">
                                {img.description}
                              </p>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>

                  {/* Control Strip */}
                  <div className="bg-slate-800 mt-2 rounded-md p-3 flex justify-between items-center">
                    <div className="flex space-x-1">
                      {carouselImages.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 w-8 rounded-full transition-colors",
                            i === activeIndex ? "bg-orange-500" : "bg-slate-600"
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs font-mono text-slate-400">
                      <span>LAT: 28.61° N</span>
                      <span>LNG: 77.20° E</span>
                    </div>
                  </div>
                </div>

                {/* Floating Stat Card */}
                
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Ticker/Stats Strip */}
        <div className="border-y border-slate-200 bg-slate-50 mt-16">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap justify-between items-center gap-6">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-blue-600 bg-blue-100 p-1.5 rounded-full">
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 leading-none">
                      {s.value}
                    </div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
              <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>
              <div className="text-xs text-slate-400 max-w-[200px] hidden lg:block leading-tight">
                Last updated: {new Date().toLocaleDateString()} <br />
                System Status:{" "}
                <span className="text-green-600 font-bold">Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-style Bento Grid Section */}
      <section ref={bentoRef} className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#003366] mb-2">
              Technical Operations Center
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Centralized control plane for managing circuit breaker health and
              operational metrics.
            </p>
          </div>
          <BentoGrid />
        </div>
      </section>

      {/* Footer Strip */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-slate-200">POWERGRID DCRM</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
          <div className="mt-4 md:mt-0 text-slate-600">
            © 2025 Powergrid Corporation of India. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
