"use client";

import { useTransition } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { reenviarCAPIEvento } from "@/lib/actions/capi";

interface Props {
  eventoId:  string;
  clienteId: string;
}

export function CAPIReenviarButton({ eventoId, clienteId }: Props) {
  const [pending, startTransition] = useTransition();

  function handleResend() {
    startTransition(async () => {
      await reenviarCAPIEvento(eventoId, clienteId);
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleResend}
      loading={pending}
      icon={<RotateCw size={12} />}
    >
      Reenviar
    </Button>
  );
}
