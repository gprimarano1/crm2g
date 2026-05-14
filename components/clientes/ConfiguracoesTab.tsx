"use client";

import { useState } from "react";
import { UserPlus, ShieldCheck, Settings2, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NovoClienteForm } from "./NovoClienteForm";
import { CriarAcessoModal } from "./CriarAcessoModal";
import { GerenciarAcessoModal } from "./GerenciarAcessoModal";
import type { Cliente } from "@/lib/actions/clientes";

interface AcessoItem {
  id: string;
  email: string;
  nome: string | null;
}

interface ConfiguracoesTabProps {
  cliente: Cliente;
  existingAccesses: AcessoItem[];
}

export function ConfiguracoesTab({
  cliente,
  existingAccesses,
}: ConfiguracoesTabProps) {
  const [acessoModalOpen, setAcessoModalOpen] = useState(false);
  const [gerenciarAcesso, setGerenciarAcesso] = useState<AcessoItem | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Dados do cliente */}
      <div className="rounded-2xl border border-bg-border bg-bg-surface">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-bg-border">
          <Settings2 size={17} className="text-accent" />
          <h3 className="font-display font-semibold text-text">Dados do cliente</h3>
        </div>
        <div className="p-5">
          <NovoClienteForm cliente={cliente} />
        </div>
      </div>

      {/* Acessos do cliente */}
      <div className="rounded-2xl border border-bg-border bg-bg-surface">
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={17} className="text-accent" />
            <h3 className="font-display font-semibold text-text">Acessos do cliente</h3>
            {existingAccesses.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent/15 px-1.5 text-[11px] font-semibold text-accent">
                {existingAccesses.length}
              </span>
            )}
          </div>
          {existingAccesses.length > 0 && (
            <Button
              variant="outline"
              icon={<UserPlus size={14} />}
              onClick={() => setAcessoModalOpen(true)}
              className="h-8 px-3 text-xs"
            >
              Adicionar
            </Button>
          )}
        </div>
        <div className="p-5 flex flex-col gap-3">
          {existingAccesses.length === 0 ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-muted">
                Este cliente ainda não tem acesso ao painel.
                Crie as credenciais para que ele possa visualizar seus relatórios,
                campanhas e leads em tempo real.
              </p>
              <Button
                variant="outline"
                icon={<UserPlus size={16} />}
                onClick={() => setAcessoModalOpen(true)}
                className="self-start"
              >
                Criar acesso do cliente
              </Button>
            </div>
          ) : (
            <>
              {existingAccesses.map((acesso) => (
                <div
                  key={acesso.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-bg-border bg-bg-surface2 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <User size={15} className="text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {acesso.nome ?? "—"}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {acesso.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGerenciarAcesso(acesso)}
                    className="flex items-center gap-1.5 shrink-0 rounded-lg border border-bg-border px-2.5 py-1.5 text-xs text-text-muted hover:bg-bg-surface hover:text-text transition-all"
                  >
                    <Settings size={13} />
                    Gerenciar
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Modal criar acesso */}
      <CriarAcessoModal
        clienteId={cliente.id}
        nomeCliente={cliente.nome_empresa}
        responsavel={cliente.responsavel}
        emailCliente={cliente.email}
        open={acessoModalOpen}
        onClose={() => setAcessoModalOpen(false)}
      />

      {/* Modal gerenciar acesso */}
      {gerenciarAcesso && (
        <GerenciarAcessoModal
          open={!!gerenciarAcesso}
          onClose={() => setGerenciarAcesso(null)}
          acesso={gerenciarAcesso}
          clienteId={cliente.id}
        />
      )}
    </div>
  );
}
