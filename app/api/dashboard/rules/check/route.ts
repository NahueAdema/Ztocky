import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { runRulesForWorkspace } from "@/lib/rules/engine";

/**
 * Motor de reglas. Dispara la evaluación de todas las reglas habilitadas.
 * - Acceso por usuario autenticado: corre las reglas de SU workspace.
 * - Acceso por CRON_SECRET: corre TODOS los workspaces (para cron de producción).
 */
export async function GET(request: NextRequest) {
  const prisma = getPrisma();

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    const workspaces = await prisma.workspace.findMany({
      where: { alertRules: { some: { enabled: true } } },
      select: { id: true },
    });
    const totals = { stock: 0, events: 0, digests: 0, workspaces: 0 };
    for (const ws of workspaces) {
      const s = await runRulesForWorkspace(ws.id);
      totals.stock += s.stock;
      totals.events += s.events;
      totals.digests += s.digests;
      totals.workspaces++;
    }
    return NextResponse.json(totals, { headers: { "Cache-Control": "no-store" } });
  }

  // Manual trigger: usuario autenticado echa correr sus propias reglas.
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!user.workspaceId) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 400 });

  const summary = await runRulesForWorkspace(user.workspaceId);
  return NextResponse.json({ ...summary, workspaces: 1 }, { headers: { "Cache-Control": "no-store" } });
}