"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { duplicarProposta } from "@/lib/actions/propostas";

interface Props {
  propostaId: string;
}

export function DuplicarPropostaButton({ propostaId }: Props) {
  const router  = useRouter();
  const [pending, startAction] = useTransition();

  function handleDuplicar() {
    startAction(async () => {
      const res = await duplicarProposta(propostaId);
      if (res.success && res.id) {
        router.push(`/propostas/${res.id}`);
      }
    });
  }

  return (
    <button
      onClick={handleDuplicar}
      disabled={pending}
      className="flex items-center gap-2 rounded-xl border border-bg-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-bg-surface2 hover:text-text transition-all disabled:opacity-50"
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
      {pending ? "Duplicando…" : "Duplicar"}
    </button>
  );
}
