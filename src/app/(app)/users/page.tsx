import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import UserList from "./components/UserList";
import AddUserModal from "./components/AddUserModal";

export default async function UsersPage() {
  const session = await getSession();
  if (session?.role !== "admin") {
    redirect("/dashboard");
  }

  const allUsers = await db
    .select()
    .from(users)
    .orderBy(users.createdAt);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Manajemen Pengguna
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola akun pengguna, hak akses driver & admin, serta lisensi SIM
          </p>
        </div>
        <div>
          <AddUserModal />
        </div>
      </div>

      {/* User List Full Width */}
      <UserList users={allUsers} />
    </div>
  );
}
