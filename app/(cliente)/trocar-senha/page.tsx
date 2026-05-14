"use client";

import { useFormState, useFormStatus } from "react-dom";
import { trocarSenhaAction, type TrocarSenhaState } from "@/app/actions/trocar-senha";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Definir nova senha"}
    </button>
  );
}

function PasswordInput({ name, label }: { name: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          required
          minLength={8}
          className="w-full rounded-xl border border-bg-border bg-bg px-4 py-2.5 pr-11 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function TrocarSenhaPage() {
  const [state, formAction] = useFormState<TrocarSenhaState, FormData>(
    trocarSenhaAction,
    null,
  );

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-bg-border bg-bg-surface p-8 shadow-lg">
        {/* Icon + title */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/30">
            <KeyRound size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-text">
              Defina sua senha
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              É o seu primeiro acesso. Crie uma senha segura para continuar.
            </p>
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <PasswordInput name="novaSenha" label="Nova senha" />
          <PasswordInput name="confirmar" label="Confirmar senha" />

          {state?.error && (
            <p className="rounded-lg bg-danger/8 px-4 py-2.5 text-sm text-danger">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
