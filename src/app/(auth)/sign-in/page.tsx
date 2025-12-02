import { Login1 } from "@/components/login1";

export default function SignIn() {
  const logo = {
    url: "https://www.shadcnblocks.com",
    src: "https://igod.gov.in/assets/images/logo.svg",
    alt: "logo",
    title: "DCRM - Portal",
  };

  return (
    <main className="bg-muted">
      <Login1 logo={logo} heading="Sign in with your station credentials" />
    </main>
  );
}