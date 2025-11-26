import { Login1 } from "@/components/login1";

export default async function SignIn() {
  // Example: fetch data on the server
 const logo = {
    url: "https://www.shadcnblocks.com",
    src: "https://igod.gov.in/assets/images/logo.svg",
    alt: "logo",
    title: "DCRM - Portal",
  }
  return (
    <main className="p-4">
      <Login1 logo={logo} />
      
    </main>
  );
}