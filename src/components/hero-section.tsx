import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
} as const;

export default function HeroSection() {
  return (
    <>
      <main className="overflow-hidden">
        {/* Background Image - Full section coverage, no repeat */}
        <div
          className="absolute inset-0 isolate hidden opacity-70 contain-strict lg:block"
          style={{
            backgroundImage: `url('/dcrm image.webp')`, // Image from public folder
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
          }}
        >
          {/* Keep existing decorative elements on top */}
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>

        <section>
          <div className="relative pt-24 md:pt-36">
            {/* AnimatedGroup with Image - Now optional since background covers */}
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="mask-b-from-35% mask-b-to-90% absolute inset-0 top-56 -z-10 lg:top-32" // Changed z-index
            >
              {/* Optional: Keep as decorative overlay if needed */}
              <div className="size-full opacity-30" />
            </AnimatedGroup>

            <div
              aria-hidden
              className="absolute inset-0 -z-20 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,rgba(0,0,0,0.6)_75%)]"
            />

            {/* Rest of your hero content remains exactly the same */}
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    href="#link"
                    className="hover:bg-background dark:hover:border-t-border bg-muted/90 backdrop-blur-sm group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-xl shadow-black/30 transition-all duration-300 dark:border-t-white/10 dark:shadow-white/10"
                  >
                    <span className="text-foreground text-sm font-medium">
                      New: AI-Powered Analysis
                    </span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                    <div className="bg-background/80 backdrop-blur-sm group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500 shadow-lg">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedGroup>

                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mx-auto mt-8 max-w-4xl text-balance text-5xl max-md:font-semibold md:text-7xl lg:mt-16 xl:text-[5.25rem] drop-shadow-2xl"
                >
                  Advanced DCRM Waveform Monitoring & Analysis
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-8 max-w-2xl text-balance text-lg drop-shadow-lg bg-background/80 backdrop-blur-sm py-3 px-6 rounded-2xl inline-block"
                >
                  Ensure the health of your circuit breakers with real-time
                  dynamic contact resistance measurement analysis. Detect faults
                  before they happen.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div
                    key={1}
                    className="bg-foreground/20 backdrop-blur-sm rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5 shadow-2xl shadow-black/30"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base shadow-xl hover:shadow-2xl backdrop-blur-sm"
                    >
                      <Link href="/dashboard">
                        <span className="text-nowrap font-semibold">
                          Start Building
                        </span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-10.5 rounded-xl px-5 backdrop-blur-sm bg-background/80 border border-border/50 shadow-xl hover:shadow-2xl"
                  >
                    <Link href="/dashboard">
                      <span className="text-nowrap font-semibold">
                        Request a demo
                      </span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            {/* Demo Image Section - Enhanced with glassmorphism */}
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="mask-b-from-55% relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div className="inset-shadow-2xs ring-background/80 dark:inset-shadow-white/30 bg-background/90 backdrop-blur-xl relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border/50 p-6 shadow-2xl shadow-black/40 ring-1 hover:shadow-3xl transition-all duration-500">
                  <Image
                    className="bg-background/50 aspect-15/8 relative hidden rounded-2xl backdrop-blur-md dark:block shadow-2xl"
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop"
                    alt="app screen"
                    width="2700"
                    height="1440"
                  />
                  <Image
                    className="z-2 border-border/50 aspect-15/8 relative rounded-2xl border backdrop-blur-md dark:hidden shadow-2xl"
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop"
                    alt="app screen"
                    width="2700"
                    height="1440"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </>
  );
}
