"use client";

import { useState, useTransition } from "react";
import { DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { atualizarOrcamentoAction } from "@/lib/actions/campanhas";

interface EditarOrcamentoModalProps {
  open: boolean;
  onClose: () => void;
  campanhaId: string;
  campanhaNome: string;
  clienteId: string;
  metaAdSetId: string | null;
  orcamentoAtual: number | null;
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

type Step = "form" | "confirm" | "success" | "error";

export function EditarOrcamentoModal({
  open,
  onClose,
  campanhaId,
  campanhaNome,
  clienteId,
  metaAdSetId,
  orcamentoAtual,
}: EditarOrcamentoModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [novoValor, setNovoValor] = useState(
    orcamentoAtual ? String(orcamentoAtual) : ""
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    setStep("form");
    setNovoValor(orcamentoAtual ? String(orcamentoAtual) : "");
    setErrorMsg("");
    onClose();
  }

  function handleConfirm() {
    const val = parseFloat(novoValor.replace(",", "."));
    if (!val || val <= 0) {
      setErrorMsg("Insira um valor válido maior que zero.");
      return;
    }
    setErrorMsg("");
    setStep("confirm");
  }

  function handleSubmit() {
    if (!metaAdSetId) {
      setErrorMsg("Esta campanha não tem um Ad Set ID vinculado.");
      setStep("error");
      return;
    }

    const val = parseFloat(novoValor.replace(",", "."));

    startTransition(async () => {
      const result = await atualizarOrcamentoAction(
        campanhaId,
        metaAdSetId,
        clienteId,
        val
      );

      if (result.success) {
        setStep("success");
      } else {
        setErrorMsg(result.error);
        setStep("error");
      }
    });
  }

  const parsedValue = parseFloat(novoValor.replace(",", "."));

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="sm"
      title={step === "success" ? "Orçamento atualizado!" : "Editar orçamento diário"}
      description={
        step === "form" || step === "confirm"
          ? campanhaNome
          : undefined
      }
    >
      {step === "form" && (
        <div className="flex flex-col gap-4">
          {orcamentoAtual !== null && (
            <div className="flex items-center justify-between rounded-xl bg-bg-surface2 border border-bg-border px-4 py-3">
              <span className="text-sm text-text-muted">Atual</span>
              <span className="text-sm font-semibold text-text">
                {formatBRL(orcamentoAtual)}<span className="text-text-subtle font-normal">/dia</span>
              </span>
            </div>
          )}

          <Input
            label="Novo orçamento diário (R$)"
            type="number"
            min="1"
            step="0.01"
            placeholder="Ex: 50.00"
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            error={errorMsg}
            leftIcon={<DollarSign size={14} />}
            autoFocus
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Continuar
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl bg-warning/8 border border-warning/20 px-4 py-3 text-sm text-text-muted">
            Você está prestes a alterar o orçamento diário no Meta Ads.
            Esta ação é aplicada imediatamente e pode afetar a veiculação.
          </div>

          <div className="flex flex-col gap-2">
            {orcamentoAtual !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-text-subtle">De</span>
                <span className="text-text line-through opacity-50">
                  {formatBRL(orcamentoAtual)}/dia
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-text-subtle">Para</span>
              <span className="text-success">
                {formatBRL(parsedValue)}/dia
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("form")} className="flex-1">
              Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isPending}
              className="flex-1"
            >
              Confirmar
            </Button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 size={28} className="text-success" />
          </div>
          <div>
            <p className="text-sm text-text-muted">
              Orçamento atualizado para{" "}
              <span className="font-semibold text-text">
                {formatBRL(parsedValue)}/dia
              </span>{" "}
              no Meta Ads e salvo no sistema.
            </p>
          </div>
          <Button onClick={handleClose} className="w-full">
            Fechar
          </Button>
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
            <AlertCircle size={28} className="text-danger" />
          </div>
          <div>
            <p className="font-medium text-text">Erro ao atualizar</p>
            <p className="text-sm text-text-muted mt-1">{errorMsg}</p>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Fechar
            </Button>
            <Button onClick={() => setStep("form")} className="flex-1">
              Tentar novamente
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
