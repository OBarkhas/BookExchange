import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/auth";
import AppShell from "@/components/navbar/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getDbUser();
  if (!user) redirect("/");

  return <AppShell userId={user.id}>{children}</AppShell>;
}
