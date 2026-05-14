"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, User, Phone, Mail, Briefcase, Calendar,
  Megaphone, Hash, Zap, MessageCircle, FileText,
  AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createCliente, updateCliente, type Cliente, type ClienteFormData } from "@/lib/actions/clientes";

const SEGMENTOS = [
  "E-commerce", "Saúde e Beleza", "Educação", "Imobiliário",
  "Restaurante / Food", "Clínica / Estética", "Advocacia",
  "Serviços", "Tecnologia", "Outros",
];

const STATUS_OPTIONS = [
  { value: "ativo",      label: "Ativo" },
  { value: "pausado",    label: "Pausado" },
  { value: "encerrado",  label: "Encerrado" },
];

// Seção colapsável do formulário
function FormSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-bg-border bg-bg-surface">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2.5 text-sm font-semibold text-text">
          <span className="text-accent">{icon}</span>
          {title}
        </div>
        {open ? (
          <ChevronUp size={16} className="text-text-subtle" />
        ) : (
          <ChevronDown size={16} className="text-text-subtle" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-bg-border px-5 pb-5 pt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NovoClienteFormProps {
  cliente?: Cliente; // se fornecido, modo de edição
  onSuccess?: () => void;
}

export function NovoClienteForm({ cliente, onSuccess }: NovoClienteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<ClienteFormData>({
    nome_empresa: cliente?.nome_empresa ?? "",
    responsavel: cliente?.responsavel ?? "",
    telefone: cliente?.telefone ?? "",
    email: cliente?.email ?? "",
    segmento: cliente?.segmento ?? "",
    status: cliente?.status ?? "ativo",
    data_inicio: cliente?.data_inicio ?? "",
    meta_page_id: cliente?.meta_page_id ?? "",
    meta_ad_account_id: cliente?.meta_ad_account_id ?? "",
    meta_pixel_id: cliente?.meta_pixel_id ?? "",
    meta_capi_token: cliente?.meta_capi_token ?? "",
    meta_access_token: cliente?.meta_access_token ?? "",
    whatsapp_referencia: cliente?.whatsapp_referencia ?? "",
    observacoes: cliente?.observacoes ?? "",
  });

  const set = (key: keyof ClienteFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  function validate(): string | null {
    if (!form.nome_empresa.trim()) return "Nome da empresa é obrigatório.";
    if (!form.responsavel.trim()) return "Responsável é obrigatório.";
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(null);

    startTransition(async () => {
      if (cliente) {
        // Modo edição
        const result = await updateCliente(cliente.id, form);
        if (!result.success) {
          setError(result.error);
        } else {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
          onSuccess?.();
        }
      } else {
        // Modo criação — createCliente faz redirect internamente
        const result = await createCliente(form);
        if (result?.error) setError(result.error);
      }
    });
  }

  const isEdit = !!cliente;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Erro global */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 rounded-xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger"
          >
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dados Básicos */}
      <FormSection title="Dados Básicos" icon={<Building2 size={16} />}>
        <div className="sm:col-span-2">
          <Input
            label="Nome da empresa *"
            value={form.nome_empresa}
            onChange={set("nome_empresa")}
            placeholder="Ex: Clínica Bella Pele"
            leftIcon={<Building2 size={15} />}
          />
        </div>
        <Input
          label="Responsável *"
          value={form.responsavel}
          onChange={set("responsavel")}
          placeholder="Nome do dono / gestor"
          leftIcon={<User size={15} />}
        />
        <Input
          label="Telefone"
          value={form.telefone ?? ""}
          onChange={set("telefone")}
          placeholder="(11) 99999-9999"
          leftIcon={<Phone size={15} />}
          type="tel"
        />
        <Input
          label="Email"
          value={form.email ?? ""}
          onChange={set("email")}
          placeholder="contato@empresa.com"
          leftIcon={<Mail size={15} />}
          type="email"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-muted">Segmento</label>
          <div className="relative">
            <Briefcase size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
            <select
              value={form.segmento ?? ""}
              onChange={set("segmento")}
              className="w-full appearance-none rounded-xl border border-bg-border bg-bg-surface2 py-2.5 pl-9 pr-9 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            >
              <option value="">Selecionar segmento</option>
              {SEGMENTOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle" />
          </div>
        </div>
      </FormSection>

      {/* Contrato */}
      <FormSection title="Contrato" icon={<Calendar size={16} />}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-muted">Status</label>
          <div className="relative">
            <select
              value={form.status}
              onChange={set("status")}
              className="w-full appearance-none rounded-xl border border-bg-border bg-bg-surface2 py-2.5 pl-4 pr-9 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle" />
          </div>
        </div>
        <Input
          label="Data de início"
          value={form.data_inicio ?? ""}
          onChange={set("data_inicio")}
          type="date"
          leftIcon={<Calendar size={15} />}
        />
      </FormSection>

      {/* Meta Ads */}
      <FormSection title="Meta Ads" icon={<Megaphone size={16} />} defaultOpen={false}>
        <Input
          label="Facebook Page ID"
          value={form.meta_page_id ?? ""}
          onChange={set("meta_page_id")}
          placeholder="123456789"
          leftIcon={<Hash size={15} />}
        />
        <Input
          label="Ad Account ID"
          value={form.meta_ad_account_id ?? ""}
          onChange={set("meta_ad_account_id")}
          placeholder="act_123456789"
          leftIcon={<Hash size={15} />}
        />
        <Input
          label="Pixel ID"
          value={form.meta_pixel_id ?? ""}
          onChange={set("meta_pixel_id")}
          placeholder="123456789"
          leftIcon={<Zap size={15} />}
        />
        <div className="sm:col-span-2">
          <Input
            label="Access Token (Sistema)"
            value={form.meta_access_token ?? ""}
            onChange={set("meta_access_token")}
            placeholder="EAAVUp..."
            type="password"
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="CAPI Token"
            value={form.meta_capi_token ?? ""}
            onChange={set("meta_capi_token")}
            placeholder="Token para Conversions API"
            type="password"
          />
        </div>
      </FormSection>

      {/* Outros */}
      <FormSection title="Outros" icon={<FileText size={16} />} defaultOpen={false}>
        <Input
          label="WhatsApp de referência"
          value={form.whatsapp_referencia ?? ""}
          onChange={set("whatsapp_referencia")}
          placeholder="(11) 99999-9999"
          leftIcon={<MessageCircle size={15} />}
        />
        <div className="sm:col-span-2">
          <Textarea
            label="Observações internas"
            value={form.observacoes ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
            placeholder="Notas internas sobre o cliente..."
            rows={3}
          />
        </div>
      </FormSection>

      {/* Ações */}
      <div className="flex items-center justify-between pt-2">
        {!isEdit && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          {saved && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-success"
            >
              ✓ Salvo com sucesso
            </motion.span>
          )}
          <Button type="submit" loading={isPending}>
            {isEdit ? "Salvar alterações" : "Cadastrar cliente"}
          </Button>
        </div>
      </div>
    </form>
  );
}
