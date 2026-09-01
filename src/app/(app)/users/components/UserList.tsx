"use client";

import { useState } from "react";
import { toggleUserStatusAction, deleteUserAction } from "../actions";
import EditUserModal from "./EditUserModal";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber: string | null;
  licenseNumber: string | null;
  address: string | null;
  status: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
}

export default function UserList({ users }: { users: User[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    setLoadingId(userId);
    await toggleUserStatusAction(userId, isActive);
    setLoadingId(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Yakin hapus user ini?")) return;
    setLoadingId(userId);
    await deleteUserAction(userId);
    setLoadingId(null);
  };

  const handleEditSuccess = () => {
    setEditUser(null);
    window.location.reload();
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Telepon / SIM
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-sm">
              {users.map((user) => {
                const isLoading = loadingId === user.id;
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitials(user.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md border ${
                          user.role === "admin"
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/50"
                            : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/50"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-mono text-zinc-800 dark:text-zinc-200 text-xs">
                          {user.phoneNumber || "-"}
                        </p>
                        {user.licenseNumber && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                            SIM: {user.licenseNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditUser(user)}
                          disabled={isLoading}
                          className="px-2.5 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(user.id, user.isActive || false)
                          }
                          disabled={isLoading}
                          className="px-2.5 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={isLoading}
                            className="px-2.5 py-1 text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm font-medium">Belum ada pengguna terdaftar</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
