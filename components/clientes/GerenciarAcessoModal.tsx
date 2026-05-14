"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User, Mail, Copy, Check,
  AlertCircle, CheckCircle2, Trash2, RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  editarNomeAcesso,
  excluirAcessoCliente,
  resetarSenhaAcesso,
} from "@/lib/actions/clientes";

interface GerenciarAcessoModalProps {
  open: boolean;
  onClose: () => void;
  acesso: {
    id: string;
    email: string;
    nome: string | null;
  };
  clienteId: string;
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

type Tela = "principal" | "resetSenha" | "confirmarExclusao";

export function GerenciarAcessoModal({
  open,
  onClose,
  acesso,
  clienteId,
}: GerenciarAcessoModalProps) {
  const [tela, setTela] = useState<Tela>("principal");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nome, setNome] = useState(acesso.nome ?? "");
  const [novaSenha, setNovaSenha] = useState<{ email: string; senha: string } | null>(null);

  function handleClose() {
    if (isPending) return;
    setTela("principal");
    setError(null);
    setNovaSenha(null);
    setNome(acesso.nome ?? "");
    onClose();
  }

  function handleSalvarNome(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await editarNomeAcesso(acesso.id, clienteId, nome.trim());
      if (!result.success) setError(result.error);
    });
  }

  function handleResetarSenha() {
    setError(null);
    startTransition(async () => {
      const result = await resetarSenhaAcesso(acesso.id, clienteId);
      if (!result.success) {
        setError(result.error);
      } else {
        setNovaSenha(result.data);
        setTela("resetSenha");
      }
    });
  }

  function handleExcluir() {
    setError(null);
    startTransition(async () => {
      const result = await excluirAcessoCliente(acesso.id, clienteId);
      if (!result.success) {
        setError(result.error);
        setTela("principal");
      } else {
        onClose();
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Gerenciar acesso"
      description={acesso.email}
      size="md"
    >
      <AnimatePresence mode="wait">
        {/* Tela principal */}
        {tela === "principal" && (
          <motion.div
            key="principal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            {/* Email (somente leitura) */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-text-subtle">Email</span>
              <div className="flex items-center gap-2.5 rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5">
                <Mail size={15} className="shrink-0 text-text-subtle" />
                <span className="flex-1 text-sm text-text-muted">{acesso.email}</span>
              </div>
            </div>

            {/* Nome (editável) */}
            <form onSubmit={handleSalvarNome} className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Nome do responsável"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome"
                  leftIcon={<User size={15} />}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                loading={isPending}
                disabled={nome.trim() === (acesso.nome ?? "") || !nome.trim()}
                className="mb-0.5 shrink-0"
              >
                Salvar
              </Button>
            </form>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="border-t border-bg-border" />

            {/* Ações */}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                icon={<RefreshCw size={15} />}
                onClick={handleResetarSenha}
                loading={isPending}
                className="justify-start"
              >
                Resetar senha (gera nova temporária)
              </Button>

              <Button
                type="button"
                variant="ghost"
                icon={<Trash2 size={15} />}
                onClick={() => setTela("confirmarExclusao")}
                className="justify-start text-danger hover:bg-danger/8 hover:text-danger"
              >
                Excluir acesso
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tela de nova senha */}
        {tela === "resetSenha" && novaSenha && (
          <motion.div
            key="resetSenha"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-2.5 rounded-xl border border-success/20 bg-success/8 px-4 py-3">
              <CheckCircle2 size={16} className="text-success shrink-0" />
              <p className="text-sm text-success font-medium">Senha resetada com sucesso!</p>
            </div>

            <div className="rounded-2xl border border-bg-border bg-bg-surface2 p-4 flex flex-col gap-3">
              <p className="text-xs text-text-subtle uppercase tracking-wider font-medium">
                Novas credenciais
              </p>
              <CopyField label="Email" value={novaSenha.email} />
              <CopyField label="Nova senha temporária" value={novaSenha.senha} />
            </div>

            <p className="text-xs text-text-muted">
              O cliente será obrigado a trocar a senha no próximo acesso.
            </p>

            <Button onClick={handleClose} className="w-full">
              Concluído
            </Button>
          </motion.div>
        )}

        {/* Tela de confirmação de exclusão */}
        {tela === "confirmarExclusao" && (
          <motion.div
            key="excluir"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-2.5 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3">
              <ShieldAlert size={16} className="text-danger shrink-0" />
              <p className="text-sm text-danger font-medium">
                Esta ação é irreversível. O cliente perderá o acesso ao painel.
              </p>
            </div>

            <p className="text-sm text-text-muted">
              Tem certeza que deseja excluir o acesso de{" "}
              <span className="font-medium text-text">{acesso.email}</span>?
            </p>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTela("principal")}
                className="flex-1"
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleExcluir}
                loading={isPending}
                className="flex-1 bg-danger hover:bg-danger/90 text-white"
              >
                Sim, excluir
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
