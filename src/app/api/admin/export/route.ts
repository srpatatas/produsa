import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAdmin } from "@/lib/apiAuth";
import { matchLabel } from "@/lib/utils";

export const GET = withAdmin(async (req, session) => {
  const sql = getDb();

  const users = await sql`
    SELECT id, name, invite_code FROM users WHERE pin != 'PENDING' ORDER BY name
  `;

  const predictions = await sql`
    SELECT user_id, match_id, outcome FROM planilla_predictions ORDER BY user_id, match_id
  `;

  const comodines = await sql`
    SELECT user_id, scope, match_id FROM planilla_comodines ORDER BY user_id
  `;

  const bonus = await sql`
    SELECT user_id, question_id, answer FROM bonus_predictions ORDER BY user_id
  `;

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Build CSV lines
  const lines: string[] = [];

  // Predictions CSV
  lines.push("--- PREDICCIONES ---");
  lines.push("Usuario,Código,Partido,Equipos,Predicción");
  for (const p of predictions) {
    const user = userMap.get(p.user_id);
    if (!user) continue;
    lines.push(`${user.name},${user.invite_code},${p.match_id},"${matchLabel(p.match_id as string)}",${p.outcome}`);
  }

  lines.push("");
  lines.push("--- COMODINES ---");
  lines.push("Usuario,Código,Fase,Partido,Equipos");
  for (const c of comodines) {
    const user = userMap.get(c.user_id);
    if (!user) continue;
    lines.push(`${user.name},${user.invite_code},${c.scope},${c.match_id},"${matchLabel(c.match_id as string)}"`);
  }

  lines.push("");
  lines.push("--- PUNTOS EXTRA ---");
  lines.push("Usuario,Código,Pregunta,Respuesta");
  for (const b of bonus) {
    const user = userMap.get(b.user_id);
    if (!user) continue;
    lines.push(`${user.name},${user.invite_code},${b.question_id},"${b.answer}"`);
  }

  const csv = lines.join("\n");
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="produsa-export-${date}.csv"`,
    },
  });
});
