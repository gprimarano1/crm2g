import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
      {/* Glow de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(circle, #5b6ef5 0%, transparent 70%)",
        }}
      />
      {/* Grade sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-[400px] rounded-2xl border border-bg-border bg-bg-surface p-8 shadow-card">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <Logo size="lg" />
          <p className="text-sm text-text-subtle">
            Acesso restrito — somente equipe autorizada
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-text-subtle">
          Não tem acesso? Solicite ao administrador.
        </p>
      </div>
    </div>
  );
}
