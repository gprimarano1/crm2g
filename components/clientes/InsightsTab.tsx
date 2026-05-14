import { getInsights } from "@/lib/actions/insights";
import { InsightsDisplay } from "./InsightsDisplay";

export async function InsightsTab({ clienteId }: { clienteId: string }) {
  const insights = await getInsights(clienteId);

  return <InsightsDisplay clienteId={clienteId} initialInsights={insights} />;
}
