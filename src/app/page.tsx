import { currentUser } from "@clerk/nextjs/server";
import HeroSection from "@/components/hero/HeroSection";
import SignedInHome from "@/components/home/SignedInHome";

export default async function Page() {
  const user = await currentUser();

  if (!user) {
    return <HeroSection />;
  }

  return <SignedInHome user={user} />;
}
