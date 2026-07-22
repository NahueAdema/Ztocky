import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

import { exchangeCode, decodeIdToken } from "@/lib/auth0";
import { createSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "workspace";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("auth0_state")?.value;

  if (!savedState || state !== savedState) {
    return NextResponse.json({ error: "State mismatch" }, { status: 400 });
  }

  cookieStore.delete("auth0_state");

  const invitationToken = cookieStore.get("pending_invitation")?.value || null;
  cookieStore.delete("pending_invitation");

  let tokenResponse;
  try {
    tokenResponse = await exchangeCode(code, req);
  } catch {
    return NextResponse.json(
      { error: "Failed to exchange authorization code" },
      { status: 500 },
    );
  }

  const profile = decodeIdToken(tokenResponse.id_token);
  const prisma = getPrisma();

  let user = await prisma.user.findUnique({
    where: { email: profile.email },
  });

  let workspaceToSwitch: string | null = null;

  if (user) {
    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Account is suspended" }, { status: 403 });
    }

    if (user.passwordHash && !user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    if (invitationToken) {
      const invitation = await prisma.workspaceInvitation.findUnique({
        where: { token: invitationToken },
      });
      if (
        invitation &&
        invitation.status === "PENDING" &&
        new Date() <= invitation.expiresAt &&
        invitation.email.toLowerCase().trim() === user.email.toLowerCase().trim()
      ) {
        const existingMember = await prisma.workspaceMember.findFirst({
          where: { userId: user.id, workspaceId: invitation.workspaceId },
        });
        if (!existingMember) {
          await prisma.workspaceMember.create({
            data: {
              userId: user.id,
              workspaceId: invitation.workspaceId,
              role: invitation.role as "ADMIN" | "MEMBER",
            },
          });
        }
        await prisma.workspaceInvitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        });
        workspaceToSwitch = invitation.workspaceId;
      }
    }
  } else {
    if (invitationToken) {
      const invitation = await prisma.workspaceInvitation.findUnique({
        where: { token: invitationToken },
      });
      if (
        invitation &&
        invitation.status === "PENDING" &&
        new Date() <= invitation.expiresAt
      ) {
        const superAdminCount = await prisma.user.count({
          where: { role: "SUPER_ADMIN" },
        });

        user = await prisma.user.create({
          data: {
            name: profile.name || profile.email.split("@")[0],
            email: profile.email,
            passwordHash: null,
            emailVerified: true,
            role: superAdminCount === 0 ? "SUPER_ADMIN" : "USER",
            memberships: {
              create: {
                role: invitation.role as "ADMIN" | "MEMBER",
                workspaceId: invitation.workspaceId,
              },
            },
          },
        });

        await prisma.workspaceInvitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        });

        workspaceToSwitch = invitation.workspaceId;
      } else {
        const workspaceName =
          profile.name?.trim() || profile.email.split("@")[0] || "Mi negocio";
        const slugBase = slugify(workspaceName);
        const workspaceSlug = `${slugBase}-${randomUUID().slice(0, 8)}`;

        const superAdminCount = await prisma.user.count({
          where: { role: "SUPER_ADMIN" },
        });

        user = await prisma.user.create({
          data: {
            name: profile.name || profile.email.split("@")[0],
            email: profile.email,
            passwordHash: null,
            emailVerified: true,
            role: superAdminCount === 0 ? "SUPER_ADMIN" : "USER",
            memberships: {
              create: {
                role: "OWNER",
                workspace: {
                  create: {
                    name: workspaceName,
                    slug: workspaceSlug,
                  },
                },
              },
            },
          },
        });
      }
    } else {
      const workspaceName =
        profile.name?.trim() || profile.email.split("@")[0] || "Mi negocio";
      const slugBase = slugify(workspaceName);
      const workspaceSlug = `${slugBase}-${randomUUID().slice(0, 8)}`;

      const superAdminCount = await prisma.user.count({
        where: { role: "SUPER_ADMIN" },
      });

      user = await prisma.user.create({
        data: {
          name: profile.name || profile.email.split("@")[0],
          email: profile.email,
          passwordHash: null,
          emailVerified: true,
          role: superAdminCount === 0 ? "SUPER_ADMIN" : "USER",
          memberships: {
            create: {
              role: "OWNER",
              workspace: {
                create: {
                  name: workspaceName,
                  slug: workspaceSlug,
                },
              },
            },
          },
        },
      });
    }
  }

  await createSession(user.id);

  if (workspaceToSwitch) {
    const member = await prisma.workspaceMember.findFirst({
      where: { userId: user.id, workspaceId: workspaceToSwitch },
    });
    if (member) {
      const wsCookieStore = await cookies();
      wsCookieStore.set("active_workspace", workspaceToSwitch, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  const redirectTo = user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
  redirect(redirectTo);
}
