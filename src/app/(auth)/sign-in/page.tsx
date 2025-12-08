import { Login1 } from "@/components/login1";

export default function SignIn() {
  const logo = {
    url: "https://www.shadcnblocks.com",
    src: "https://igod.gov.in/assets/images/logo.svg",
    alt: "logo",
    title: "DCRM - Portal",
  };

  return (
    <main className="flex min-h-screen">
      {/* Left side - Background Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-contain bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/dcrm image.webp')" }}
      >
        {/* Optional overlay for better readability */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Optional content over the image */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-lg text-center">Access your DCRM portal with your station credentials</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-muted p-8">
        <div className="w-full max-w-md">
          <Login1 logo={logo} heading="Sign in with your station credentials" />
        </div>
      </div>
    </main>
  );
}