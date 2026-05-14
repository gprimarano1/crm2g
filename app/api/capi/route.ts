import { NextRequest, NextResponse } from "next/server";
import { sendCAPIEvent } from "@/lib/capi/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      cliente_id: string;
      lead_id?:   string | null;
      event_name: string;
      email?:     string;
      telefone?:  string;
      nome?:      string;
      valor?:     number;
    };

    const { cliente_id, lead_id, event_name, email, telefone, nome, valor } = body;

    if (!cliente_id || !event_name) {
      return NextResponse.json(
        { error: "cliente_id e event_name são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await sendCAPIEvent(
      cliente_id,
      lead_id ?? null,
      event_name,
      { email, telefone, nome, valor }
    );

    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (err) {
    console.error("[API CAPI] Erro:", err);
    return NextResponse.json({ error: "Falha ao enviar evento" }, { status: 500 });
  }
}
