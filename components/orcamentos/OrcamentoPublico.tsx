"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  MapPin,
  Phone,
  Clock,
  CreditCard,
  Sparkles,
  Calendar,
  CheckCircle2,
  Mail,
  Globe,
} from "lucide-react";
import {
  FULLHOUSE_LOGO_URL,
  FULLHOUSE_CASAL_IMAGEM_URL,
  FULLHOUSE_SOBRE,
  FULLHOUSE_ENDERECOS,
  FULLHOUSE_SOCIAL,
} from "@/lib/constants/fullhouse";
import type { Orcamento } from "@/lib/actions/orcamentos";

function brl(v: number): string {
  return Number(v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtData(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function OrcamentoPublico({ orcamento }: { orcamento: Orcamento }) {
  const subtotal = orcamento.produtos.reduce(
    (s, p) => s + Number(p.valor || 0) * Number(p.quantidade || 1),
    0,
  );
  const economia = orcamento.produtos.reduce(
    (s, p) =>
      p.em_promocao && p.valor_de
        ? s + Math.max(0, Number(p.valor_de) - Number(p.valor)) * Number(p.quantidade || 1)
        : s,
    0,
  );

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      {/* ============ HEADER ============ */}
      <header className="border-b border-[#E8E4DD] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div className="relative h-9 w-40">
            <Image
              src={FULLHOUSE_LOGO_URL}
              alt="Full House Decoração"
              fill
              priority
              className="object-contain object-left"
            />
          </div>
          <div className="hidden text-right text-[11px] uppercase tracking-[0.18em] text-[#8B7355] sm:block">
            Mobiliário de Alto Padrão
            <div className="mt-0.5 text-[10px] text-[#9A9A9A]">desde 2014</div>
          </div>
        </div>
      </header>

      {/* ============ CAPA / HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#F4F0E8] via-[#FAFAF8] to-[#FAFAF8]" />
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#B8956A]/40 bg-white px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#8B7355]">
            <Sparkles size={11} /> Orçamento Exclusivo
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] text-[#111] md:text-5xl">
            Preparado especialmente para
            <br />
            <span className="italic text-[#8B7355]">{orcamento.cliente_nome}</span>
          </h1>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[#6B6B6B]">
            {orcamento.numero && (
              <span className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#9A9A9A]">Nº</span>
                <span className="font-medium text-[#1A1A1A]">{orcamento.numero}</span>
              </span>
            )}
            <span className="flex items-center gap-2">
              <Calendar size={14} className="text-[#B8956A]" />
              Emitido em <strong className="font-medium text-[#1A1A1A]">{fmtData(orcamento.data_emissao)}</strong>
            </span>
            <span className="flex items-center gap-2">
              <Clock size={14} className="text-[#B8956A]" />
              Válido até <strong className="font-medium text-[#1A1A1A]">{fmtData(orcamento.data_validade)}</strong>
            </span>
          </div>
        </motion.div>
      </section>

      {/* ============ SOBRE ============ */}
      <section className="border-y border-[#E8E4DD] bg-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-[1fr_1.3fr] md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative aspect-[4/5] overflow-hidden rounded-sm shadow-[0_30px_60px_-30px_rgba(139,115,85,0.4)]"
          >
            <Image
              src={FULLHOUSE_CASAL_IMAGEM_URL}
              alt="Fundadores da Full House"
              fill
              sizes="(min-width: 768px) 400px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent p-5 text-white">
              <div className="font-display text-sm tracking-wide">Full House Decoração</div>
              <div className="text-[11px] text-white/80">Fundadores</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          >
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#B8956A]">Nossa história</div>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-[#111]">
              {FULLHOUSE_SOBRE.titulo}
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-[#3D3D3D]">
              {FULLHOUSE_SOBRE.texto}
            </p>
            <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[#8B7355]">
              <span className="h-px w-10 bg-[#B8956A]/50" />
              Design · Conforto · Exclusividade
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ PRODUTOS ============ */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-10 text-center"
        >
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#B8956A]">Itens do orçamento</div>
          <h2 className="mt-2 font-display text-3xl font-bold text-[#111]">Seleção exclusiva</h2>
          <div className="mx-auto mt-4 h-px w-16 bg-[#B8956A]/50" />
        </motion.div>

        <div className="flex flex-col gap-8">
          {orcamento.produtos.map((p, idx) => (
            <motion.article
              key={p.id ?? idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.05, ease: EASE }}
              className="grid gap-6 overflow-hidden rounded-sm border border-[#E8E4DD] bg-white p-5 md:grid-cols-[340px_1fr] md:p-6"
            >
              {/* Imagem */}
              <div className="relative aspect-square overflow-hidden rounded-sm bg-white">
                {p.imagem_url ? (
                  <Image
                    src={p.imagem_url}
                    alt={p.nome}
                    fill
                    sizes="(min-width: 768px) 340px, 100vw"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-wider text-[#9A9A9A]">
                    Sem imagem
                  </div>
                )}
                {p.em_promocao && (
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1 bg-[#1A1A1A] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
                    <Sparkles size={10} /> Oferta
                  </div>
                )}
              </div>

              {/* Detalhes */}
              <div className="flex flex-col">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#9A9A9A]">
                  Item {String(idx + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-1 font-display text-2xl font-bold leading-tight text-[#111]">
                  {p.nome}
                </h3>
                {p.descricao && (
                  <p className="mt-2 whitespace-pre-line text-[14px] leading-[1.65] text-[#4D4D4D]">
                    {p.descricao}
                  </p>
                )}

                {p.prazo_entrega && (
                  <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#E8E4DD] bg-[#FAFAF8] px-3 py-1.5 text-[11px] text-[#6B6B6B]">
                    <Clock size={11} className="text-[#B8956A]" />
                    Entrega: <strong className="font-medium text-[#1A1A1A]">{p.prazo_entrega}</strong>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-[#E8E4DD] pt-4">
                  <div>
                    {p.em_promocao && p.valor_de ? (
                      <>
                        <div className="text-[12px] text-[#9A9A9A]">
                          De <span className="line-through">{brl(p.valor_de)}</span>
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#B8956A]">Por</div>
                        <div className="font-display text-3xl font-bold text-[#1A1A1A]">
                          {brl(p.valor)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#9A9A9A]">Valor unitário</div>
                        <div className="font-display text-3xl font-bold text-[#1A1A1A]">
                          {brl(p.valor)}
                        </div>
                      </>
                    )}
                  </div>
                  {p.quantidade > 1 && (
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[#9A9A9A]">
                        {p.quantidade}× — Subtotal
                      </div>
                      <div className="font-display text-xl font-semibold text-[#8B7355]">
                        {brl(Number(p.valor) * Number(p.quantidade))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ============ TOTAL + PAGAMENTO ============ */}
      <section className="bg-[#1A1A1A] text-white">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#B8956A]">Investimento total</div>
              <div className="mt-2 font-display text-5xl font-bold tracking-tight">
                {brl(subtotal)}
              </div>
              {economia > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#B8956A]/20 px-3 py-1.5 text-[12px] text-[#E5C99A]">
                  <CheckCircle2 size={12} /> Economia de {brl(economia)} nas ofertas
                </div>
              )}
            </div>

            {orcamento.formas_pagamento && (
              <div className="rounded-sm border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#B8956A]">
                  <CreditCard size={12} /> Formas de pagamento
                </div>
                <p className="whitespace-pre-line text-[14px] leading-[1.7] text-white/85">
                  {orcamento.formas_pagamento}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ OBSERVAÇÕES ============ */}
      {orcamento.observacoes && (
        <section className="border-b border-[#E8E4DD] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-10">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#B8956A]">Observações</div>
            <p className="mt-3 whitespace-pre-line text-[14px] leading-[1.75] text-[#3D3D3D]">
              {orcamento.observacoes}
            </p>
          </div>
        </section>
      )}

      {/* ============ ENDEREÇOS ============ */}
      <section className="bg-[#FAFAF8]">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#B8956A]">Venha nos visitar</div>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#111]">Nossas lojas</h2>
            <div className="mx-auto mt-4 h-px w-16 bg-[#B8956A]/50" />
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {FULLHOUSE_ENDERECOS.map((end) => (
              <div
                key={end.unidade}
                className="rounded-sm border border-[#E8E4DD] bg-white p-6"
              >
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#8B7355]">Unidade</div>
                <h3 className="mt-1 font-display text-2xl font-bold text-[#111]">{end.unidade}</h3>

                <div className="mt-4 flex items-start gap-3 text-sm text-[#4D4D4D]">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#B8956A]" />
                  <div>
                    <div>{end.rua}</div>
                    <div className="text-[#6B6B6B]">{end.bairroCidade}</div>
                    <div className="text-[#6B6B6B]">CEP {end.cep}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 text-sm text-[#4D4D4D]">
                  <Phone size={15} className="shrink-0 text-[#B8956A]" />
                  <div>
                    <div>{end.telefone}</div>
                    <div className="text-[#6B6B6B]">WhatsApp: {end.whatsapp}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-[#E8E4DD] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-8 text-center text-[12px] text-[#6B6B6B]">
          <div className="relative h-7 w-32">
            <Image
              src={FULLHOUSE_LOGO_URL}
              alt="Full House"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.18em]">
            <a
              href={`mailto:${FULLHOUSE_SOCIAL.email}`}
              className="flex items-center gap-1.5 transition hover:text-[#8B7355]"
            >
              <Mail size={11} /> {FULLHOUSE_SOCIAL.email}
            </a>
            <a
              href={`https://instagram.com/${FULLHOUSE_SOCIAL.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 transition hover:text-[#8B7355]"
            >
              <Globe size={11} /> {FULLHOUSE_SOCIAL.instagram}
            </a>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#9A9A9A]">
            {FULLHOUSE_SOCIAL.site} · desde 2014
          </div>
        </div>
      </footer>
    </main>
  );
}
