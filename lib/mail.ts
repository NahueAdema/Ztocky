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

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name: string,
  baseUrl?: string,
) {
  const resetUrl = `${baseUrl || env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f5f5f5;padding:40px 20px">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0;text-align:center">
<p style="font-size:24px;font-weight:bold;color:#038786">Ztocky</p>
<p style="margin-top:24px;font-size:16px;color:#1a1a1a"><strong>Hola ${name},</strong></p>
<p style="font-size:14px;color:#666;line-height:1.5">Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón para crear una nueva.</p>
<a href="${resetUrl}" style="display:inline-block;margin-top:20px;padding:14px 32px;background:#038786;color:#fff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600">Restablecer contraseña</a>
<p style="margin-top:24px;font-size:12px;color:#999">O copiá este link en tu navegador:<br><span style="color:#038786">${resetUrl}</span></p>
<p style="margin-top:20px;font-size:12px;color:#999">Si no solicitaste esto, ignorá este correo. El link expira en 1 hora.</p>
</td></tr></table></body></html>`;

  await sendMail(email, "Restablecé tu contraseña — Ztocky", html);
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

export async function sendOrderToSupplier(
  supplierEmail: string,
  order: {
    id: string;
    supplierName: string;
    totalAmount: string;
    notes: string | null;
    items: { productName: string; quantity: number; unitPrice: string; totalPrice: string }[];
  },
) {
  const itemsHtml = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 16px;border-bottom:1px solid #eee">${i.productName}</td>
        <td style="padding:8px 16px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
        <td style="padding:8px 16px;border-bottom:1px solid #eee;text-align:right">${i.unitPrice}</td>
        <td style="padding:8px 16px;border-bottom:1px solid #eee;text-align:right">${i.totalPrice}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f5f5f5;padding:40px 20px">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0;text-align:center">
<p style="font-size:24px;font-weight:bold;color:#038786">Ztocky</p>
<p style="margin-top:24px;font-size:16px;color:#1a1a1a"><strong>Nueva orden de compra</strong></p>
<p style="font-size:14px;color:#666;line-height:1.5">Orden <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> — ${order.supplierName}</p>
</td></tr>
<tr><td style="padding:16px 32px">
<table style="width:100%;border-collapse:collapse">
<thead><tr style="background:#f5f5f5">
<th style="padding:8px 16px;text-align:left;font-size:13px">Producto</th>
<th style="padding:8px 16px;text-align:center;font-size:13px">Cantidad</th>
<th style="padding:8px 16px;text-align:right;font-size:13px">P. Unit.</th>
<th style="padding:8px 16px;text-align:right;font-size:13px">Subtotal</th>
</tr></thead>
<tbody>${itemsHtml}</tbody>
</table>
</td></tr>
<tr><td style="padding:16px 32px;text-align:right;border-top:2px solid #038786">
<p style="font-size:18px;font-weight:bold;color:#038786">Total: ${order.totalAmount}</p>
</td></tr>
${order.notes ? `<tr><td style="padding:0 32px 16px;font-size:13px;color:#666"><strong>Notas:</strong> ${order.notes}</td></tr>` : ""}
<tr><td style="padding:16px 32px 32px;text-align:center;font-size:12px;color:#999">
<p>Este es un pedido generado automáticamente desde Ztocky.</p>
</td></tr>
</table></body></html>`;

  await sendMail(supplierEmail, `🧾 Nueva orden #${order.id.slice(0, 8).toUpperCase()} — Ztocky`, html);
}

export async function sendPriceChangesToSupplier(
  supplierEmail: string,
  supplierName: string,
  storeName: string,
  changes: {
    productName: string;
    productSku: string;
    previousPrice: number | null;
    newPrice: number;
    changeType: string;
  }[],
) {
  const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

  const rowsHtml = changes
    .map((c) => {
      const badge =
        c.changeType === "CREATED"
          ? `<span style="background:#16a34a20;color:#16a34a;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600">NUEVO</span>`
          : c.changeType === "DELETED"
            ? `<span style="background:#dc262620;color:#dc2626;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600">ELIMINADO</span>`
            : `<span style="background:#03878620;color:#038786;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600">ACTUALIZADO</span>`;
      const priceInfo =
        c.previousPrice !== null && c.changeType !== "CREATED"
          ? `${money.format(c.previousPrice)} → ${money.format(c.newPrice)}`
          : money.format(c.newPrice);
      return `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #eee">
          <p style="margin:0;font-size:13px;font-weight:600;color:#1a1a1a">${c.productName}</p>
          <p style="margin:2px 0 0;font-size:11px;color:#999;font-family:monospace">${c.productSku}</p>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:center">${badge}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:right;font-size:13px;color:#1a1a1a">${priceInfo}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f5f5f5;padding:40px 20px">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0;text-align:center">
<p style="font-size:24px;font-weight:bold;color:#038786">Ztocky</p>
<p style="margin-top:24px;font-size:16px;color:#1a1a1a"><strong>Actualización de precios</strong></p>
<p style="font-size:14px;color:#666;line-height:1.5"><strong>${storeName}</strong> actualizó los precios de <strong>${changes.length}</strong> producto${changes.length > 1 ? "s" : ""} en tu catálogo.</p>
</td></tr>
<tr><td style="padding:16px 32px">
<table style="width:100%;border-collapse:collapse">
<thead><tr style="background:#f5f5f5">
<th style="padding:8px 16px;text-align:left;font-size:12px;color:#666">Producto</th>
<th style="padding:8px 16px;text-align:center;font-size:12px;color:#666">Tipo</th>
<th style="padding:8px 16px;text-align:right;font-size:12px;color:#666">Precio</th>
</tr></thead>
<tbody>${rowsHtml}</tbody>
</table>
</td></tr>
<tr><td style="padding:16px 32px 32px;text-align:center;font-size:12px;color:#999">
<p>Estos cambios ya están aplicados en tu catálogo dentro de Ztocky.</p>
</td></tr>
</table></body></html>`;

  await sendMail(supplierEmail, `💰 ${storeName} actualizó precios — Ztocky`, html);
}

export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  workspaceName: string,
  token: string,
  baseUrl?: string,
) {
  const inviteUrl = `${baseUrl || env.NEXT_PUBLIC_APP_URL}/invitations/${token}`;

  const html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f5f5f5;padding:40px 20px">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0;text-align:center">
<p style="font-size:24px;font-weight:bold;color:#038786">Ztocky</p>
<p style="margin-top:24px;font-size:16px;color:#1a1a1a"><strong>Te invitaron a un equipo</strong></p>
<p style="font-size:14px;color:#666;line-height:1.5"><strong>${inviterName}</strong> te invitó a formar parte de <strong>"${workspaceName}"</strong> en Ztocky.</p>
<a href="${inviteUrl}" style="display:inline-block;margin-top:20px;padding:14px 32px;background:#038786;color:#fff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600">Aceptar invitación</a>
<p style="margin-top:24px;font-size:12px;color:#999">O copiá este link en tu navegador:<br><span style="color:#038786">${inviteUrl}</span></p>
<p style="margin-top:20px;font-size:12px;color:#999">Si no conoces a esta persona, ignorá este correo.</p>
</td></tr></table></body></html>`;

  await sendMail(email, `Te invitaron a "${workspaceName}" — Ztocky`, html);
}
