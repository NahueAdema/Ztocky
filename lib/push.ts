import webpush from "web-push";
import { env } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  const email = env.VAPID_EMAIL;
  const subject = email.startsWith("mailto:") || email.startsWith("http") ? email : `mailto:${email}`;
  webpush.setVapidDetails(subject, env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  vapidConfigured = true;
}

export async function sendPushToSubscription(
  subscription: {
    endpoint: string;
    authSecret: string;
    p256dh: string;
  },
  payload: PushPayload,
) {
  ensureVapid();
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.authSecret,
      p256dh: subscription.p256dh,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { ok: true as const };
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    // 404/410: la suscripción expiró o fue eliminada
    if (statusCode === 404 || statusCode === 410) {
      try {
        await getPrisma().pushSubscription.delete({
          where: { endpoint: subscription.endpoint },
        });
      } catch {
        // ignore
      }
      return { ok: false as const, reason: "expired" };
    }
    return { ok: false as const, reason: "error" };
  }
}

export async function sendPushToWorkspace(
  workspaceId: string,
  payload: PushPayload,
  opts: { skipUserId?: string } = {},
) {
  ensureVapid();
  const prisma = getPrisma();
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        include: { pushSubscriptions: true },
      },
    },
  });

  let sent = 0;
  for (const member of members) {
    if (opts.skipUserId && member.userId === opts.skipUserId) continue;
    for (const sub of member.user.pushSubscriptions) {
      const result = await sendPushToSubscription(
        {
          endpoint: sub.endpoint,
          authSecret: sub.authSecret,
          p256dh: sub.p256dh,
        },
        payload,
      );
      if (result.ok) sent++;
    }
  }

  return { sent };
}
