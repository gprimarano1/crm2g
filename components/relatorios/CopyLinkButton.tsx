"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  link:        string;
  relatorioId: string;
}

export function CopyLinkButton({ link }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
      const input = document.createElement("input");
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Link copiado!" : "Copiar link"}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
        copied
          ? "border-success/30 bg-success/10 text-success"
          : "border-bg-border text-text-subtle hover:text-text hover:bg-bg-surface2"
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}
