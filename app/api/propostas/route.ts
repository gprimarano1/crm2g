import { NextRequest, NextResponse } from "next/server";
import { generateWithClaude } from "@/lib/claude/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cliente, servicos, investimento, objetivo } = body;

    if (!cliente || !servicos) {
      return NextResponse.json(
        { error: "cliente e servicos são obrigatórios" },
        { status: 400 }
      );
    }

    const systemPrompt = `Você é um especialista em marketing digital que cria propostas comerciais profissionais e persuasivas em português brasileiro.
Crie propostas detalhadas, bem estruturadas e focadas em resultados para o cliente.`;

    const prompt = `Crie uma proposta comercial completa para:

Cliente: ${cliente}
Serviços: ${Array.isArray(servicos) ? servicos.join(", ") : servicos}
Investimento mensal: R$ ${investimento ?? "a definir"}
Objetivo principal: ${objetivo ?? "não especificado"}

Inclua: apresentação, diagnóstico, solução proposta, escopo de serviços, metodologia, resultados esperados, investimento e próximos passos.`;

    const proposta = await generateWithClaude(prompt, systemPrompt, 3000);
    return NextResponse.json({ proposta });
  } catch (err) {
    console.error("[API Propostas] Erro:", err);
    return NextResponse.json({ error: "Falha ao gerar proposta" }, { status: 500 });
  }
}
