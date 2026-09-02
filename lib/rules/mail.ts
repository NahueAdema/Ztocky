import nodemailer from "nodemailer";
import { env } from "@/lib/env";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTransporter() {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  });
}

function sendMail(to: string, subject: string, html: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[DEV] Email to ${to}: ${subject}`);
    return;
  }
  return transporter.sendMail({ from: `Ztocky <${env.GMAIL_USER}>`, to, subject, html });
}

function row(label: string, message: string, tone: { bg: string; fg: string; text: string }) {
  return `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #eee">
          <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a1a">${escapeHtml(label)}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#666">${escapeHtml(message)}</p>
        </td>
        <td style="padding:10px 16px;text-align:center;white-space:nowrap"><span style="background:${tone.bg};color:${tone.fg};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600">${tone.text}</span></td>
      </tr>`;
}

/**
 * Email de resumen configurable por reglas. Combina alertas de stock
 * (críticas / bajo) con otros eventos de negocio que el usuario eligió seguir.
 */
export async function sendRuleDigestEmail(
  email: string,
  name: string,
  payload: {
    digest?: {
      critical: { productName: string; message: string }[];
      low: { productName: string; message: string }[];
    };
    other?: { title: string; message: string; type: string }[];
  },
) {
  const critical = payload.digest?.critical ?? [];
  const low = payload.digest?.low ?? [];
  const other = payload.other ?? [];
  const total = critical.length + low.length + other.length;

  const titleText =
    total <= 1 ? "1 novedad en Ztocky" : `${total} novedades en Ztocky`;

  const rows: string[] = [];
  for (const a of critical) {
    rows.push(row(a.productName, a.message, { bg: "#dc262620", fg: "#dc2626", text: "Crítico" }));
  }
  for (const a of low) {
    rows.push(row(a.productName, a.message, { bg: "#ca8a0420", fg: "#ca8a04", text: "Bajo stock" }));
  }
  for (const o of other) {
    rows.push(row(o.title, o.message, { bg: "#03878620", fg: "#038786", text: "Evento" }));
  }

  const section =
    rows.length > 0
      ? `<tr><td style="padding:20px 32px 4px;font-size:13px;font-weight:700;color:#1a1a1a">⚠️ Actividad reciente</td></tr>
     <tr><td style="padding:4px 0 0">${rows.join("")}</td></tr>`
      : "";

  const html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f5f5f5;padding:40px 20px">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0;text-align:center">
<p style="font-size:24px;font-weight:bold;color:#038786">Ztocky</p>
<p style="margin-top:24px;font-size:16px;color:#1a1a1a"><strong>Hola ${escapeHtml(name)},</strong></p>
<p style="margin-top:8px;font-size:14px;color:#666;line-height:1.5">Tu resumen de alertas por las reglas que configuraste.</p>
</td></tr>
${section}
<tr><td style="padding:20px 32px 32px;text-align:center">
<a href="${env.NEXT_PUBLIC_APP_URL}/dashboard/alerts" style="display:inline-block;padding:12px 28px;background:#038786;color:#fff;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600">Ver alertas</a>
<p style="margin-top:16px;font-size:12px;color:#999">Podés ajustar tus reglas cuando quieras desde Ztocky.</p>
</td></tr>
</table></body></html>`;

  await sendMail(email, `📋 ${titleText} — Ztocky`, html);
}