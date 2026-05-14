"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AdminShellProps {
  profile: {
    nome: string | null;
    email: string | null;
  };
  newLeadsCount: number;
  clientesCount: number;
  children: React.ReactNode;
}

export function AdminShell({
  profile,
  newLeadsCount,
  clientesCount,
  children,
}: AdminShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar
        profile={profile}
        newLeadsCount={newLeadsCount}
        clientesCount={clientesCount}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} newLeadsCount={newLeadsCount} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
