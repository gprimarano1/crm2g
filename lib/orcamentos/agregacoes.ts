// ================================================================
// Utilitários de agregação sobre orçamentos (puro, sem I/O).
// Separado de lib/actions/orcamentos.ts porque "use server" só aceita
// exports async functions.
// ================================================================

import type { OrcamentoProduto } from "@/lib/actions/orcamentos";

export type TopProduto = {
  nome:        string;
  ocorrencias: number; // quantas vezes aparece em orçamentos distintos
  quantidade:  number; // soma das quantidades
  total:       number; // soma de valor × quantidade
};

export function agregarTopProdutos(
  orcamentos: { produtos: OrcamentoProduto[] }[],
  limite = 10,
): TopProduto[] {
  const map = new Map<string, TopProduto>();
  for (const o of orcamentos) {
    for (const p of o.produtos ?? []) {
      const nome = (p.nome ?? "").trim();
      if (!nome) continue;
      const key = nome.toLowerCase();
      const qtd = Number(p.quantidade ?? 1);
      const val = Number(p.valor ?? 0) * qtd;
      const cur = map.get(key);
      if (cur) {
        cur.ocorrencias += 1;
        cur.quantidade  += qtd;
        cur.total       += val;
      } else {
        map.set(key, { nome, ocorrencias: 1, quantidade: qtd, total: val });
      }
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.ocorrencias - a.ocorrencias || b.total - a.total)
    .slice(0, limite);
}
