/* eslint-disable @next/next/no-img-element */
"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Login1Props {
  heading?: string;
  logo: {
    url: string;
    src: string;
    alt: string;
    title?: string;
  };
  buttonText?: string;
  googleText?: string;
  signupText?: string;
  signupUrl?: string;
  onSubmit?: (credentials: { stationId: string; password: string }) => void;
}

const Login1 = ({
  heading = "Login",
  logo = {
    url: "https://www.shadcnblocks.com",
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-wordmark.svg",
    alt: "logo",
    title: "DCRM - Portal",
  },
  buttonText = "Login",
  onSubmit,
}: Login1Props) => {
  const [stationId, setStationId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Log the credentials to console
    console.log("Station ID:", stationId);
    console.log("Password:", password);
    
    // If onSubmit prop is provided, call it with the credentials
    if (onSubmit) {
      onSubmit({ stationId, password });
    }
  };

  return (
    <section className="bg-muted h-screen">
      <div className="flex h-full items-center justify-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-6 lg:justify-start">
          <a href={logo.url}>
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-10 dark:invert"
            />
          </a>
          <form onSubmit={handleSubmit} className="min-w-sm border-muted bg-background flex w-full max-w-sm flex-col items-center gap-y-4 rounded-md border px-6 py-8 shadow-md">
            {heading && <h1 className="text-xl font-semibold">{heading}</h1>}
            <Input
              type="email"
              placeholder="Station_Id"
              className="text-sm"
              required
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Station_Password"
              className="text-sm"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full">
              {buttonText}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export { Login1 };