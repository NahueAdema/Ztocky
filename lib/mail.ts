import nodemailer from "nodemailer";
import { env } from "@/lib/env";

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

export async function sendVerificationEmail(email: string, token: string, name: string, baseUrl?: string) {
  const verifyUrl = `${baseUrl || env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;

  const html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f5f5f5;padding:40px 20px">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0;text-align:center">
<p style="font-size:24px;font-weight:bold;color:#038786">Ztocky</p>
<p style="margin-top:24px;font-size:16px;color:#1a1a1a"><strong>Hola ${name},</strong></p>
<p style="font-size:14px;color:#666;line-height:1.5">Gracias por registrarte. Hacé clic en el botón para verificar tu correo y activar tu cuenta.</p>
<a href="${verifyUrl}" style="display:inline-block;margin-top:20px;padding:14px 32px;background:#038786;color:#fff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600">Verificar email</a>
<p style="margin-top:24px;font-size:12px;color:#999">O copiá este link en tu navegador:<br><span style="color:#038786">${verifyUrl}</span></p>
<p style="margin-top:20px;font-size:12px;color:#999">Este link expira en 24 horas.</p>
</td></tr></table></body></html>`;

  await sendMail(email, "Verificá tu email — Ztocky", html);
}

export async function sendAlertNotification(
  email: string,
  name: string,
  alert: { type: string; message: string; productName: string },
) {
  const color = alert.type === "CRITICAL_STOCK" ? "#dc2626" : "#ca8a04";

  const html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f5f5f5;padding:40px 20px">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0;text-align:center">
<p style="font-size:24px;font-weight:bold;color:#038786">Ztocky</p>
<p style="margin-top:24px;font-size:16px;color:#1a1a1a"><strong>Hola ${name},</strong></p>
<p style="margin-top:8px;font-size:14px;color:#666;line-height:1.5">${alert.message}</p>
<div style="margin-top:16px;padding:16px;border-radius:12px;background:${color}10;border:1px solid ${color}30">
<p style="font-size:13px;color:#1a1a1a"><strong>${alert.productName}</strong></p>
</div>
<p style="margin-top:16px;font-size:12px;color:#999">Ingresá a Ztocky para ver los detalles y tomar acción.</p>
</td></tr></table></body></html>`;

  await sendMail(email, `⚠️ Alerta: ${alert.productName} — Ztocky`, html);
}

export async function sendOrderNotification(
  email: string,
  name: string,
  order: { id: string; status: string; supplierName: string; totalAmount: string },
) {
  const statusLabels: Record<string, string> = {
    SENT: "enviada al proveedor",
    CONFIRMED: "confirmada",
    SHIPPED: "en camino",
    RECEIVED: "recibida",
    CANCELLED: "cancelada",
  };
  const label = statusLabels[order.status] || order.status;

  const html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f5f5f5;padding:40px 20px">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0;text-align:center">
<p style="font-size:24px;font-weight:bold;color:#038786">Ztocky</p>
<p style="margin-top:24px;font-size:16px;color:#1a1a1a"><strong>Hola ${name},</strong></p>
<p style="margin-top:8px;font-size:14px;color:#666;line-height:1.5">La orden <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> de <strong>${order.supplierName}</strong> fue <strong>${label}</strong>.</p>
<div style="margin-top:16px;padding:16px;border-radius:12px;background:#03878610;border:1px solid #03878630">
<p style="font-size:13px;color:#1a1a1a">Total: <strong>${order.totalAmount}</strong></p>
</div>
<p style="margin-top:16px;font-size:12px;color:#999">Ingresá a Ztocky para ver el seguimiento completo.</p>
</td></tr></table></body></html>`;

  await sendMail(email, `📦 Orden ${label} — Ztocky`, html);
}
