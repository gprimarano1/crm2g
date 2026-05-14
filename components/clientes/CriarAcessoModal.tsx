"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, KeyRound, Copy, Check,
  AlertCircle, CheckCircle2, ExternalLink,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { criarAcessoCliente } from "@/lib/actions/clientes";

interface Credenciais {
  email: string;
  senha: string;
}

interface CriarAcessoModalProps {
  clienteId: string;
  nomeCliente: string;
  responsavel: string;
  emailCliente?: string | null;
  open: boolean;
  onClose: () => void;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-text-subtle">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5">
        <span className="flex-1 font-mono text-sm text-text">{value}</span>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 text-text-subtle hover:text-accent transition-colors"
        >
          {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}

export function CriarAcessoModal({
  clienteId,
  nomeCliente,
  responsavel,
  emailCliente,
  open,
  onClose,
}: CriarAcessoModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [credenciais, setCredenciais] = useState<Credenciais | null>(null);

  const [email, setEmail] = useState(emailCliente ?? "");
  const [nome, setNome] = useState(responsavel);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  function handleClose() {
    if (!isPending) {
      setError(null);
      setCredenciais(null);
      onClose();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Email obrigatório."); return; }
    setError(null);

    startTransition(async () => {
      const result = await criarAcessoCliente(clienteId, email.trim(), nome.trim() || responsavel);
      if (!result.success) {
        setError(result.error);
      } else {
        setCredenciais(result.data);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Criar acesso do cliente"
      description={`O cliente ${nomeCliente} poderá acessar o painel com estas credenciais.`}
      size="md"
    >
      <AnimatePresence mode="wait">
        {credenciais ? (
          /* Tela de sucesso com credenciais */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-2.5 rounded-xl border border-success/20 bg-success/8 px-4 py-3">
              <CheckCircle2 size={16} className="text-success shrink-0" />
              <p className="text-sm text-success font-medium">
                Acesso criado com sucesso!
              </p>
            </div>

            <div className="rounded-2xl border border-bg-border bg-bg-surface2 p-4 flex flex-col gap-3">
              <p className="text-xs text-text-subtle uppercase tracking-wider font-medium">
                Credenciais de acesso
              </p>
              <CopyField label="URL de acesso" value={`${appUrl}/painel`} />
              <CopyField label="Email" value={credenciais.email} />
              <CopyField label="Senha temporária" value={credenciais.senha} />
            </div>

            <p className="text-xs text-text-muted">
              Compartilhe estas credenciais com o cliente.
              A senha deve ser trocada no primeiro acesso.
            </p>

            <Button
              type="button"
              variant="ghost"
              icon={<ExternalLink size={15} />}
              onClick={() => window.open(`${appUrl}/painel`, "_blank")}
            >
              Abrir painel do cliente
            </Button>

            <Button onClick={handleClose} className="w-full">
              Concluído
            </Button>
          </motion.div>
        ) : (
          /* Formulário de criação */
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <Input
              label="Nome do responsável"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={responsavel}
              leftIcon={<User size={15} />}
            />
            <Input
              label="Email de acesso *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com"
              leftIcon={<Mail size={15} />}
              type="email"
              required
            />

            <div className="rounded-xl bg-bg-surface2 border border-bg-border px-4 py-3 flex items-start gap-2.5 text-sm text-text-muted">
              <KeyRound size={15} className="shrink-0 mt-0.5 text-text-subtle" />
              <p>
                Uma senha temporária será gerada automaticamente.
                O cliente poderá trocar a senha após o primeiro acesso.
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" loading={isPending} className="flex-1">
                Criar acesso
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}
