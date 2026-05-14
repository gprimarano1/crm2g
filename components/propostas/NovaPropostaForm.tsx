"use client";

import { useState, useTransition, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Check, Copy, ExternalLink,
  Plus, X, Upload, Sparkles, Loader2, Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  criarProposta, atualizarProposta, uploadLogo,
  type Proposta, type PropostaServico, type PropostaKPI, type PropostaDiferencial,
} from "@/lib/actions/propostas";

// ================================================================
// Defaults
// ================================================================

const SERVICOS_PADRAO: PropostaServico[] = [
  { id: "meta-ads",    nome: "Gestão de Tráfego Meta Ads",   descricao: "Criação, otimização e gestão completa de campanhas no Facebook e Instagram Ads com foco em geração de leads qualificados.", valor: 0, incluido: true  },
  { id: "criativos",  nome: "Criação de Criativos",           descricao: "Design de imagens, carrosséis e vídeos curtos otimizados para conversão nas plataformas Meta.",                        valor: 0, incluido: false },
  { id: "estrategia", nome: "Estratégia de Campanhas",        descricao: "Planejamento estratégico de mídias, públicos, objetivos e estrutura de campanha para maximizar resultados.",           valor: 0, incluido: true  },
  { id: "relatorios", nome: "Relatórios Semanais",            descricao: "Relatórios detalhados de performance com métricas, insights e recomendações enviados toda semana.",                   valor: 0, incluido: true  },
  { id: "lead-ads",   nome: "Gestão de Lead Ads",             descricao: "Criação e otimização de formulários nativos do Facebook e Instagram para captação de leads diretamente na plataforma.", valor: 0, incluido: false },
  { id: "capi",       nome: "Configuração de CAPI",           descricao: "Integração da Conversions API para rastreamento preciso de conversões, melhorando a qualidade do sinal para o algoritmo.", valor: 0, incluido: false },
  { id: "consultoria",nome: "Consultoria Mensal",             descricao: "Reunião mensal de estratégia com análise aprofundada de resultados, alinhamento de metas e planejamento do próximo mês.", valor: 0, incluido: true  },
];

const DEFAULT_DIFERENCIAIS: PropostaDiferencial[] = [
  { id: "d1", texto: "Atendimento personalizado e proativo" },
  { id: "d2", texto: "Relatórios transparentes com acesso completo às métricas" },
  { id: "d3", texto: "Equipe especializada em performance digital" },
];

const PRAZOS = ["Mensal sem fidelidade", "3 meses", "6 meses", "12 meses"];

// ================================================================
// Step indicator
// ================================================================

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done   = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center gap-2">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
              done   && "bg-success text-white",
              active && "bg-accent text-white ring-2 ring-accent/30",
              !done && !active && "border border-bg-border text-text-subtle",
            )}>
              {done ? <Check size={12} /> : n}
            </div>
            {n < total && (
              <div className={cn("h-px w-8 transition-colors", n < current ? "bg-success" : "bg-bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ================================================================
// Field wrapper
// ================================================================

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-text-muted">{label}</label>
        {optional && <span className="text-[10px] text-text-subtle uppercase tracking-wide">Opcional</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls = "h-10 w-full rounded-xl border border-bg-border bg-bg-surface2 px-3 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-text-subtle";
const textareaCls = "w-full rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-text-subtle resize-none";

// ================================================================
// Live Preview
// ================================================================

function LivePreview({ empresa, logoUrl, servicos, kpis, prazo }: {
  empresa: string;
  logoUrl: string;
  servicos: PropostaServico[];
  kpis: PropostaKPI[];
  prazo: string;
}) {
  const incluidos = servicos.filter((s) => s.incluido);
  const total     = incluidos.reduce((s, c) => s + (c.valor ?? 0), 0);

  return (
    <div className="rounded-2xl border border-bg-border bg-bg-surface p-5 flex flex-col gap-4 sticky top-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-text-subtle">Preview</p>

      {/* Header */}
      <div className="flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="logo" className="h-10 w-10 rounded-lg object-contain bg-white p-1" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent font-bold text-sm">
            {empresa ? empresa[0]?.toUpperCase() : "?"}
          </div>
        )}
        <div>
          <p className="font-display font-bold text-text">{empresa || "Nome da empresa"}</p>
          <p className="text-xs text-text-subtle">Proposta Comercial</p>
        </div>
      </div>

      {/* Services */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle mb-2">Serviços</p>
        <div className="flex flex-col gap-1">
          {incluidos.length === 0 ? (
            <p className="text-xs text-text-subtle italic">Nenhum serviço selecionado</p>
          ) : (
            incluidos.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Check size={11} className="text-success shrink-0" />
                  <span className="text-xs text-text-muted">{s.nome}</span>
                </div>
                {s.valor > 0 && (
                  <span className="text-xs font-medium text-text tabular-nums">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(s.valor)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* KPIs */}
      {kpis.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle mb-2">KPIs</p>
          <div className="flex flex-wrap gap-1.5">
            {kpis.map((k) => (
              <span key={k.id} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] text-accent font-medium">{k.texto}</span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-bg-border pt-3 flex items-center justify-between">
        <span className="text-xs text-text-subtle">{prazo || "Prazo a definir"}</span>
        {total > 0 && (
          <span className="text-sm font-bold text-text">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(total)}<span className="text-xs font-normal text-text-subtle">/mês</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ================================================================
// NovaPropostaForm
// ================================================================

interface Props {
  propostaExistente?: Proposta;
  baseUrl: string;
}

export function NovaPropostaForm({ propostaExistente, baseUrl }: Props) {
  const router = useRouter();
  const isEdit = !!propostaExistente;

  // Step 1 — Prospect
  const [prospectNome, setProspectNome] = useState(propostaExistente?.prospect_nome ?? "");
  const [empresa,      setEmpresa]      = useState(propostaExistente?.empresa       ?? "");
  const [segmento,     setSegmento]     = useState(propostaExistente?.segmento      ?? "");
  const [logoUrl,      setLogoUrl]      = useState(propostaExistente?.logo_url      ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError,    setLogoError]    = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2 — Serviços
  const [servicos,         setServicos]         = useState<PropostaServico[]>(propostaExistente?.servicos ?? SERVICOS_PADRAO);
  const [kpis,             setKpis]             = useState<PropostaKPI[]>(propostaExistente?.kpis ?? []);
  const [kpiInput,         setKpiInput]         = useState("");
  const [customServiceNome, setCustomServiceNome] = useState("");
  const [customServiceValor, setCustomServiceValor] = useState("");

  // Step 3 — Personalização
  const [prazo,            setPrazo]      = useState(propostaExistente?.prazo_contrato        ?? "12 meses");
  const [mensagem,         setMensagem]   = useState(propostaExistente?.mensagem_personalizada ?? "");
  const [diferenciais,     setDiferenciais] = useState<PropostaDiferencial[]>(propostaExistente?.diferenciais ?? DEFAULT_DIFERENCIAIS);
  const [difInput,         setDifInput]   = useState("");

  // UI
  const [step,        setStep]     = useState(1);
  const [pending,     startAction] = useTransition();
  const [result,      setResult]   = useState<{ slug: string; id: string } | null>(null);
  const [error,       setError]    = useState<string | null>(null);
  const [copied,      setCopied]   = useState(false);

  // ---- Logo upload ----
  async function handleLogoFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError("");
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("logo", file);
    const res = await uploadLogo(fd);
    setUploadingLogo(false);
    if (res.url) setLogoUrl(res.url);
    else setLogoError(res.error ?? "Erro ao enviar");
  }

  // ---- Servico toggle ----
  function toggleServico(id: string) {
    setServicos((prev) => prev.map((s) => s.id === id ? { ...s, incluido: !s.incluido } : s));
  }
  function setServicoValor(id: string, valor: string) {
    const v = parseFloat(valor.replace(",", ".")) || 0;
    setServicos((prev) => prev.map((s) => s.id === id ? { ...s, valor: v } : s));
  }
  function addCustomService() {
    if (!customServiceNome.trim()) return;
    const id = `custom-${Date.now()}`;
    setServicos((prev) => [...prev, {
      id,
      nome:     customServiceNome.trim(),
      descricao: "",
      valor:    parseFloat(customServiceValor.replace(",", ".")) || 0,
      incluido: true,
    }]);
    setCustomServiceNome("");
    setCustomServiceValor("");
  }
  function removeServico(id: string) {
    setServicos((prev) => prev.filter((s) => s.id !== id));
  }

  // ---- KPIs ----
  function addKpi() {
    if (!kpiInput.trim()) return;
    setKpis((prev) => [...prev, { id: `k-${Date.now()}`, texto: kpiInput.trim() }]);
    setKpiInput("");
  }
  function removeKpi(id: string) { setKpis((prev) => prev.filter((k) => k.id !== id)); }

  // ---- Diferenciais ----
  function addDif() {
    if (!difInput.trim()) return;
    setDiferenciais((prev) => [...prev, { id: `d-${Date.now()}`, texto: difInput.trim() }]);
    setDifInput("");
  }
  function removeDif(id: string) { setDiferenciais((prev) => prev.filter((d) => d.id !== id)); }

  // ---- Submit ----
  function handleSubmit() {
    setError(null);
    startAction(async () => {
      const args = {
        prospectNome,
        empresa,
        segmento,
        logoUrl,
        servicos,
        kpis,
        prazoContrato:         prazo,
        mensagemPersonalizada: mensagem,
        diferenciais,
      };

      if (isEdit && propostaExistente) {
        const res = await atualizarProposta(propostaExistente.id, args);
        if (res.success) {
          router.push(`/propostas/${propostaExistente.id}`);
        } else {
          setError(res.error ?? "Erro ao atualizar");
        }
      } else {
        const res = await criarProposta(args);
        if (res.success && res.slug && res.id) {
          setResult({ slug: res.slug, id: res.id });
        } else {
          setError(res.error ?? "Erro ao criar proposta");
        }
      }
    });
  }

  const link = result ? `${baseUrl}/proposta/${result.slug}` : null;

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ---- Success state ----
  if (result && link) {
    return (
      <div className="max-w-lg flex flex-col gap-4">
        <div className="rounded-2xl border border-success/20 bg-success/8 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Check size={18} className="text-success" />
            <p className="font-semibold text-success">Proposta gerada com sucesso!</p>
          </div>
          <p className="text-sm text-text-muted mb-4">
            Compartilhe o link abaixo com o prospect. O link é público e não requer login.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2.5 font-mono text-xs text-text-muted truncate">
              {link}
            </div>
            <button onClick={handleCopy} className={cn(
              "flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium transition-all",
              copied ? "border-success/30 bg-success/10 text-success" : "border-bg-border text-text-muted hover:bg-bg-surface2 hover:text-text"
            )}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
            <a href={link} target="_blank" rel="noopener noreferrer"
              className="flex h-9 items-center gap-2 rounded-xl border border-bg-border px-3 text-xs font-medium text-text-muted hover:bg-bg-surface2 hover:text-text transition-all">
              <ExternalLink size={13} />
              Abrir
            </a>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(`/propostas/${result.id}`)}>
            Ver detalhes
          </Button>
          <Button variant="ghost" onClick={() => router.push("/propostas")}>
            Todas as propostas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      {/* Form */}
      <div className="flex flex-col gap-5">
        {/* Step indicator */}
        <div className="flex items-center justify-between">
          <StepIndicator current={step} total={3} />
          <p className="text-xs text-text-subtle">
            {step === 1 && "Prospect"}
            {step === 2 && "Serviços"}
            {step === 3 && "Personalização"}
          </p>
        </div>

        {/* Step 1 — Prospect */}
        {step === 1 && (
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-5 flex flex-col gap-4">
            <Field label="Nome do contato">
              <input className={inputCls} placeholder="Ex: João Silva" value={prospectNome} onChange={(e) => setProspectNome(e.target.value)} />
            </Field>
            <Field label="Nome da empresa">
              <input className={inputCls} placeholder="Ex: Clínica Saúde Total" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
            </Field>
            <Field label="Segmento" optional>
              <input className={inputCls} placeholder="Ex: Saúde, Imóveis, Educação…" value={segmento} onChange={(e) => setSegmento(e.target.value)} />
            </Field>
            <Field label="Logo da empresa" optional>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="relative h-14 w-14 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="logo" className="h-14 w-14 rounded-xl object-contain bg-white p-1 border border-bg-border" />
                    <button onClick={() => setLogoUrl("")} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-bg-surface border border-bg-border text-text-subtle hover:text-danger transition-colors">
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-bg-border text-text-subtle">
                    <ImageIcon size={20} />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex h-9 items-center gap-2 rounded-xl border border-bg-border px-3 text-xs font-medium text-text-muted hover:bg-bg-surface2 hover:text-text transition-all disabled:opacity-50"
                  >
                    {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {uploadingLogo ? "Enviando…" : logoUrl ? "Trocar logo" : "Upload de logo"}
                  </button>
                  <p className="text-[11px] text-text-subtle">PNG, JPG ou SVG — máx. 2 MB</p>
                  {logoError && <p className="text-[11px] text-danger">{logoError}</p>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
              </div>
            </Field>
          </div>
        )}

        {/* Step 2 — Serviços */}
        {step === 2 && (
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-5 flex flex-col gap-5">
            {/* Services list */}
            <div>
              <p className="text-sm font-medium text-text-muted mb-3">Serviços incluídos</p>
              <div className="flex flex-col gap-2">
                {servicos.map((s) => (
                  <div key={s.id} className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer",
                    s.incluido ? "border-accent/30 bg-accent/5" : "border-bg-border bg-bg-surface2 hover:border-bg-border/80"
                  )} onClick={() => toggleServico(s.id)}>
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                      s.incluido ? "bg-accent border-accent text-white" : "border-bg-border"
                    )}>
                      {s.incluido && <Check size={11} />}
                    </div>
                    <span className="flex-1 text-sm text-text">{s.nome}</span>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-text-subtle">R$</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={s.valor || ""}
                        onChange={(e) => setServicoValor(s.id, e.target.value)}
                        className="w-20 h-7 rounded-lg border border-bg-border bg-bg px-2 text-xs text-text outline-none focus:border-accent text-right"
                      />
                      <span className="text-xs text-text-subtle">/mês</span>
                    </div>
                    {s.id.startsWith("custom-") && (
                      <button onClick={(e) => { e.stopPropagation(); removeServico(s.id); }} className="text-text-subtle hover:text-danger transition-colors">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add custom service */}
            <div className="rounded-xl border border-dashed border-bg-border p-3 flex flex-col gap-2">
              <p className="text-xs font-medium text-text-subtle">Adicionar serviço personalizado</p>
              <div className="flex gap-2">
                <input
                  className={cn(inputCls, "flex-1")}
                  placeholder="Nome do serviço"
                  value={customServiceNome}
                  onChange={(e) => setCustomServiceNome(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addCustomService(); }}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-text-subtle">R$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={customServiceValor}
                    onChange={(e) => setCustomServiceValor(e.target.value)}
                    className="w-20 h-10 rounded-xl border border-bg-border bg-bg-surface2 px-2 text-sm text-text outline-none focus:border-accent text-right"
                  />
                </div>
                <button
                  onClick={addCustomService}
                  disabled={!customServiceNome.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-40 hover:bg-accent/90 transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div>
              <p className="text-sm font-medium text-text-muted mb-2">KPIs prometidos</p>
              <div className="flex gap-2 mb-2">
                <input
                  className={cn(inputCls, "flex-1")}
                  placeholder="Ex: 30 leads/mês, CPL < R$ 50, ROI 4x…"
                  value={kpiInput}
                  onChange={(e) => setKpiInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKpi(); } }}
                />
                <button onClick={addKpi} disabled={!kpiInput.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-40 hover:bg-accent/90 transition-colors">
                  <Plus size={15} />
                </button>
              </div>
              {kpis.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {kpis.map((k) => (
                    <span key={k.id} className="flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 pl-3 pr-1.5 py-1 text-xs text-accent font-medium">
                      {k.texto}
                      <button onClick={() => removeKpi(k.id)} className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-accent/20 transition-colors">
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Personalização */}
        {step === 3 && (
          <div className="rounded-2xl border border-bg-border bg-bg-surface p-5 flex flex-col gap-4">
            <Field label="Prazo do contrato">
              <div className="relative">
                <select value={prazo} onChange={(e) => setPrazo(e.target.value)} className={cn(inputCls, "appearance-none pr-8 cursor-pointer")}>
                  {PRAZOS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronRight size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-text-subtle" />
              </div>
            </Field>

            <Field label="Mensagem personalizada" optional>
              <textarea
                rows={4}
                className={textareaCls}
                placeholder="Ex: Olá João, é um prazer apresentar nossa proposta para a Clínica Saúde Total. Preparamos esta proposta pensando especificamente nas necessidades de vocês…"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
            </Field>

            <div>
              <p className="text-sm font-medium text-text-muted mb-2">Diferenciais a destacar</p>
              <div className="flex gap-2 mb-2">
                <input
                  className={cn(inputCls, "flex-1")}
                  placeholder="Ex: Resultados em 30 dias ou devolvemos o investimento"
                  value={difInput}
                  onChange={(e) => setDifInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDif(); } }}
                />
                <button onClick={addDif} disabled={!difInput.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white disabled:opacity-40 hover:bg-accent/90 transition-colors">
                  <Plus size={15} />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {diferenciais.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 rounded-xl border border-bg-border bg-bg-surface2 px-3 py-2">
                    <Check size={13} className="text-success shrink-0" />
                    <span className="flex-1 text-sm text-text-muted">{d.texto}</span>
                    <button onClick={() => removeDif(d.id)} className="text-text-subtle hover:text-danger transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger/8 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button variant="outline" icon={<ChevronLeft size={15} />} onClick={() => setStep((s) => s - 1)}>
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && (!prospectNome.trim() || !empresa.trim())}
              icon={<ChevronRight size={15} />}
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={pending}
              icon={<Sparkles size={15} />}
            >
              {pending ? (isEdit ? "Salvando…" : "Gerando proposta…") : (isEdit ? "Salvar alterações" : "Gerar Proposta")}
            </Button>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div className="hidden lg:block">
        <LivePreview
          empresa={empresa}
          logoUrl={logoUrl}
          servicos={servicos}
          kpis={kpis}
          prazo={prazo}
        />
      </div>
    </div>
  );
}
