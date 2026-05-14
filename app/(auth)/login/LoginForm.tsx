"use client";

import { useFormState, useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
      style={{ background: "var(--accent)" }}
    >
      <span
        className="absolute inset-0 opacity-0 transition-opacity duration-200 hover:opacity-100"
        style={{ background: "var(--accent-hover)" }}
      />
      <span className="relative flex items-center justify-center gap-2">
        {pending && <LoadingSpinner size="sm" />}
        {pending ? "Entrando..." : "Entrar"}
      </span>
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState<LoginState, FormData>(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {/* Erro */}
      <AnimatePresence>
        {state?.error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger"
          >
            <AlertCircle size={16} className="shrink-0" />
            {state.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-text-muted"
        >
          Email
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle"
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="seu@email.com"
            className="w-full rounded-xl border border-bg-border bg-bg-surface2 py-3 pl-10 pr-4 text-sm text-text placeholder:text-text-subtle outline-none transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </div>
      </div>

      {/* Senha */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-text-muted"
        >
          Senha
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle"
          />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••••"
            className="w-full rounded-xl border border-bg-border bg-bg-surface2 py-3 pl-10 pr-12 text-sm text-text placeholder:text-text-subtle outline-none transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
