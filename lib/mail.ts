import { env } from "@/lib/env";

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  if (!env.RESEND_API_KEY) {
    console.log(`[DEV] Verification link for ${email}: ${verifyUrl}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL || "Ztocky <onboarding@resend.dev>",
    to: email,
    subject: "Verificá tu email — Ztocky",
    html: `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#f5f5f5;padding:40px 20px">
<table align="center" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">
<tr><td style="padding:32px 32px 0;text-align:center">
<p style="font-size:24px;font-weight:bold;color:#038786">Ztocky</p>
<p style="margin-top:24px;font-size:16px;color:#1a1a1a"><strong>Hola ${name},</strong></p>
<p style="font-size:14px;color:#666;line-height:1.5">Gracias por registrarte. Hace clic en el botón para verificar tu correo y activar tu cuenta.</p>
<a href="${verifyUrl}" style="display:inline-block;margin-top:20px;padding:14px 32px;background:#038786;color:#fff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:600">Verificar email</a>
<p style="margin-top:24px;font-size:12px;color:#999">O copiá este link en tu navegador:<br><span style="color:#038786">${verifyUrl}</span></p>
<p style="margin-top:20px;font-size:12px;color:#999">Este link expira en 24 horas.</p>
</td></tr></table></body></html>`,
  });
}
