import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import ClientLayout from "./ClientLayout";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <ClientLayout
      user={{
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </ClientLayout>
  );
}
