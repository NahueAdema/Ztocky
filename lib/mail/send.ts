import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "@/lib/env";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const resendFrom = env.RESEND_FROM_EMAIL
  ? `Ztocky <${env.RESEND_FROM_EMAIL}>`
  : `Ztocky <onboarding@resend.dev>`;

const gmailFrom = `Ztocky <${env.GMAIL_USER}>`;

function getGmailTransporter() {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  });
}

/**
 * Punto único de envío de emails.
 *
 * - Si `RESEND_API_KEY` está configurada, envía vía Resend (recomendado para
 *   producción con dominio propio: verificado, entregabilidad, tracking).
 * - Si no, cae a Gmail SMTP (`GMAIL_USER` + `GMAIL_APP_PASSWORD`).
 * - Si no hay ninguna credencial, solo loguea en consola (modo dev).
 */
export async function sendEmail(to: string, subject: string, html: string) {
  if (resend) {
    const { error } = await resend.emails.send({ from: resendFrom, to, subject, html });
    if (error) throw new Error(`Resend: ${error.message}`);
    return;
  }

  const transporter = getGmailTransporter();
  if (!transporter) {
    console.log(`[DEV] Email to ${to}: ${subject}`);
    return;
  }

  await transporter.sendMail({ from: gmailFrom, to, subject, html });
}